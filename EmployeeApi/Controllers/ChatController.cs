using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using EmployeeApi.Data;
using EmployeeApi.Models;
using EmployeeApi.Services;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ChatService _chat;

    public ChatController(AppDbContext db, ChatService chat)
    {
        _db = db;
        _chat = chat;
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatRequest req)
    {
        if (req.Messages.Count == 0)
            return BadRequest(new { message = "No messages provided." });

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "User";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Employee";

        string systemPrompt;

        if (role == "Employee")
        {
            var empIdClaim = User.FindFirst("employeeId")?.Value;
            Employee? emp = null;
            if (int.TryParse(empIdClaim, out var empId))
                emp = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == empId);

            var leaves = emp is not null
                ? await _db.LeaveRequests.AsNoTracking()
                    .Where(l => l.EmployeeId == emp.Id)
                    .OrderByDescending(l => l.CreatedAt)
                    .Take(5).ToListAsync()
                : new List<LeaveRequest>();

            var payrolls = emp is not null
                ? await _db.Payrolls.AsNoTracking()
                    .Where(p => p.EmployeeId == emp.Id)
                    .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                    .Take(3).ToListAsync()
                : new List<Payroll>();

            var circulars = await _db.Circulars.AsNoTracking()
                .Where(c => c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .Take(5).ToListAsync();

            systemPrompt = BuildEmployeePrompt(emp, leaves, payrolls, circulars);
        }
        else
        {
            systemPrompt = $"""
                You are a helpful HR assistant for HR Manager, an employee management system.
                You assist HR staff and administrators with HR-related questions and system usage.
                Current user: {username} (Role: {role})
                Answer questions about HR policies, employee management, payroll, leave management,
                and how to use the HR system. Keep responses concise and professional.
                """;
        }

        var history = req.Messages.Select(m => (m.Role, m.Content));
        var reply = await _chat.GetReplyAsync(systemPrompt, history);

        return Ok(new { reply });
    }

    private static string BuildEmployeePrompt(
        Employee? emp,
        List<LeaveRequest> leaves,
        List<Payroll> payrolls,
        List<Circular> circulars)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are a helpful HR assistant for HR Manager, an employee management system.");
        sb.AppendLine("Help this employee with questions about HR policies, their leave, salary, and company updates.");
        sb.AppendLine("Be friendly, concise, and supportive. For sensitive matters, suggest contacting HR directly.");
        sb.AppendLine();

        if (emp is not null)
        {
            sb.AppendLine("## Employee Profile");
            sb.AppendLine($"- Name: {emp.FirstName} {emp.LastName}");
            sb.AppendLine($"- Department: {emp.Department}");
            sb.AppendLine($"- Position: {emp.Position ?? "N/A"}");
            sb.AppendLine($"- Status: {emp.Status ?? "Active"}");
            sb.AppendLine($"- Hire Date: {emp.HireDate}");
        }

        if (leaves.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("## Recent Leave Requests");
            foreach (var l in leaves)
                sb.AppendLine($"- {l.LeaveType}: {l.StartDate} → {l.EndDate} | Status: {l.Status}");
        }

        if (payrolls.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("## Recent Payroll");
            foreach (var p in payrolls)
                sb.AppendLine($"- {p.Month}/{p.Year}: Net Pay = {p.NetPay:C} | Status: {p.Status}");
        }

        if (circulars.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("## Active Company Circulars");
            foreach (var c in circulars)
                sb.AppendLine($"- [{c.CreatedAt:MMM d}] {c.Title}: {c.Content}");
        }

        return sb.ToString();
    }
}

public record ChatMessageDto(string Role, string Content);
public record ChatRequest(List<ChatMessageDto> Messages);
