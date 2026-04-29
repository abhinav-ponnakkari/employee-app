using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EmployeeApi.Data;
using EmployeeApi.Models;
using EmployeeApi.Services;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;
    private readonly EmailService _email;

    public PayrollController(AppDbContext db, AuditService audit, EmailService email)
    {
        _db = db;
        _audit = audit;
        _email = email;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? employeeId,
        [FromQuery] int? month,
        [FromQuery] int? year)
    {
        var query = _db.Payrolls.Include(p => p.Items).AsQueryable();

        if (User.IsInRole("Employee"))
        {
            var empIdClaim = User.FindFirst("employeeId")?.Value;
            if (!int.TryParse(empIdClaim, out var myEmpId) || myEmpId <= 0)
                return Ok(Array.Empty<Payroll>());
            query = query.Where(p => p.EmployeeId == myEmpId);
        }
        else
        {
            if (employeeId.HasValue) query = query.Where(p => p.EmployeeId == employeeId.Value);
        }

        if (month.HasValue) query = query.Where(p => p.Month == month.Value);
        if (year.HasValue) query = query.Where(p => p.Year == year.Value);

        return Ok(await query.OrderByDescending(p => p.Year).ThenByDescending(p => p.Month).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payroll = await _db.Payrolls.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (payroll is null) return NotFound();

        if (User.IsInRole("Employee"))
        {
            var empIdClaim = User.FindFirst("employeeId")?.Value;
            if (!int.TryParse(empIdClaim, out var myEmpId) || myEmpId != payroll.EmployeeId)
                return Forbid();
        }

        return Ok(payroll);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] CreatePayrollDto dto)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

        var payroll = new Payroll
        {
            EmployeeId = dto.EmployeeId,
            Month = dto.Month,
            Year = dto.Year,
            BaseSalary = dto.BaseSalary,
            NetPay = dto.BaseSalary,
            Notes = dto.Notes,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = username,
        };

        _db.Payrolls.Add(payroll);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Created", "Payroll", payroll.Id, username, $"Employee #{payroll.EmployeeId} {payroll.Month}/{payroll.Year}");

        return CreatedAtAction(nameof(GetById), new { id = payroll.Id }, payroll);
    }

    [HttpPost("{id}/items")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> AddItem(int id, [FromBody] AddPayrollItemDto dto)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

        var payroll = await _db.Payrolls.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (payroll is null) return NotFound();

        var item = new PayrollItem
        {
            PayrollId = id,
            Type = dto.Type,
            Label = dto.Label,
            Amount = dto.Amount,
        };

        payroll.Items.Add(item);
        RecalcNetPay(payroll);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Updated", "Payroll", id, username, $"Added {dto.Type}: {dto.Label} ({dto.Amount})");

        return Ok(payroll);
    }

    [HttpDelete("{id}/items/{itemId}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> DeleteItem(int id, int itemId)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

        var payroll = await _db.Payrolls.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (payroll is null) return NotFound();

        var item = payroll.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return NotFound();

        payroll.Items.Remove(item);
        RecalcNetPay(payroll);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Updated", "Payroll", id, username, $"Removed item #{itemId}");

        return Ok(payroll);
    }

    [HttpPatch("{id}/finalize")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Finalize(int id)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

        var payroll = await _db.Payrolls.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (payroll is null) return NotFound();

        payroll.Status = "Finalized";
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Finalized", "Payroll", id, username, null);

        // Send payslip email to employee
        var emp = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == payroll.EmployeeId);
        if (emp is not null && !string.IsNullOrWhiteSpace(emp.Email))
        {
            var monthNames = new[] { "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec" };
            var monthYear = $"{monthNames[payroll.Month - 1]} {payroll.Year}";
            var allowances = payroll.Items.Where(i => i.Type == "Allowance").Sum(i => i.Amount);
            var deductions = payroll.Items.Where(i => i.Type == "Deduction").Sum(i => i.Amount);

            var (subject, html) = EmailTemplates.Payslip(
                $"{emp.FirstName} {emp.LastName}",
                monthYear,
                payroll.BaseSalary,
                allowances,
                deductions,
                payroll.NetPay);
            _ = _email.SendAsync(emp.Email, subject, html);
        }

        return Ok(payroll);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

        var payroll = await _db.Payrolls.FindAsync(id);
        if (payroll is null) return NotFound();

        if (payroll.Status != "Draft")
            return BadRequest(new { message = "Only Draft payrolls can be deleted." });

        _db.Payrolls.Remove(payroll);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Deleted", "Payroll", id, username, $"ID {id}");

        return NoContent();
    }

    // POST /api/payroll/bulk — generate payroll for all active employees for a month
    [HttpPost("bulk")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> BulkGenerate([FromBody] BulkPayrollDto dto)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

        var employees = await _db.Employees.AsNoTracking()
            .Where(e => e.Status == null || e.Status == "Active")
            .ToListAsync();

        var existing = await _db.Payrolls.AsNoTracking()
            .Where(p => p.Month == dto.Month && p.Year == dto.Year)
            .Select(p => p.EmployeeId)
            .ToListAsync();

        var toCreate = employees.Where(e => !existing.Contains(e.Id)).ToList();
        if (toCreate.Count == 0)
            return BadRequest(new { message = "Payroll already generated for all active employees this month." });

        var payrolls = toCreate.Select(e => new Payroll
        {
            EmployeeId = e.Id,
            Month = dto.Month,
            Year = dto.Year,
            BaseSalary = e.Salary,
            NetPay = e.Salary,
            Notes = dto.Notes,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = username,
        }).ToList();

        _db.Payrolls.AddRange(payrolls);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("BulkCreated", "Payroll", null, username,
            $"{payrolls.Count} payrolls for {dto.Month}/{dto.Year}");

        return Ok(new { created = payrolls.Count, skipped = existing.Count });
    }

    private void RecalcNetPay(Payroll p)
    {
        p.NetPay = p.BaseSalary
            + p.Items.Where(i => i.Type == "Allowance").Sum(i => i.Amount)
            - p.Items.Where(i => i.Type == "Deduction").Sum(i => i.Amount);
    }
}

public record CreatePayrollDto(int EmployeeId, int Month, int Year, decimal BaseSalary, string? Notes);
public record AddPayrollItemDto(string Type, string Label, decimal Amount);
public record BulkPayrollDto(int Month, int Year, string? Notes);
