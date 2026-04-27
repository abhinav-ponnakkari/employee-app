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
public class LeaveRequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public LeaveRequestsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? employeeId, [FromQuery] string? status)
    {
        // Employee role: only see own requests
        if (User.IsInRole("Employee"))
        {
            var myId = GetLinkedEmployeeId();
            if (myId is null) return Ok(Array.Empty<LeaveRequest>());
            return Ok(await _db.LeaveRequests
                .Where(r => r.EmployeeId == myId.Value)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync());
        }

        var query = _db.LeaveRequests.AsQueryable();
        if (employeeId.HasValue) query = query.Where(r => r.EmployeeId == employeeId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(r => r.Status == status);
        return Ok(await query.OrderByDescending(r => r.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.LeaveRequests.FindAsync(id);
        if (r is null) return NotFound();
        // Employee can only see their own
        if (User.IsInRole("Employee") && r.EmployeeId != GetLinkedEmployeeId()) return Forbid();
        return Ok(r);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR,Employee")]
    public async Task<IActionResult> Create(LeaveRequest request)
    {
        // Employee can only submit for themselves
        if (User.IsInRole("Employee"))
        {
            var myId = GetLinkedEmployeeId();
            if (myId is null) return BadRequest(new { message = "No employee record linked to your account." });
            request.EmployeeId = myId.Value;
        }

        request.Status = "Pending";
        request.CreatedAt = DateTime.UtcNow;
        _db.LeaveRequests.Add(request);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Created", "Leave", request.Id, username, $"Employee #{request.EmployeeId} - {request.LeaveType}");

        return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] LeaveStatusUpdate dto)
    {
        var request = await _db.LeaveRequests.FindAsync(id);
        if (request is null) return NotFound();
        request.Status = dto.Status;
        request.ReviewNote = dto.ReviewNote;
        await _db.SaveChangesAsync();

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        if (dto.Status == "Approved")
            await _audit.LogAsync("Approved", "Leave", id, username, null);
        else if (dto.Status == "Rejected")
            await _audit.LogAsync("Rejected", "Leave", id, username, dto.ReviewNote);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var request = await _db.LeaveRequests.FindAsync(id);
        if (request is null) return NotFound();
        _db.LeaveRequests.Remove(request);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Deleted", "Leave", id, username, null);

        return NoContent();
    }

    private int? GetLinkedEmployeeId()
    {
        var claim = User.FindFirst("employeeId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }
}

public record LeaveStatusUpdate(string Status, string? ReviewNote);
