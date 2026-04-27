using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalaryHistoryController : ControllerBase
{
    private readonly AppDbContext _db;
    public SalaryHistoryController(AppDbContext db) => _db = db;

    [HttpGet("employee/{employeeId}")]
    public async Task<IActionResult> GetByEmployee(int employeeId)
    {
        // Employee can only view their own salary history
        if (User.IsInRole("Employee"))
        {
            var myId = GetLinkedEmployeeId();
            if (myId != employeeId) return Forbid();
        }
        else if (!User.IsInRole("Admin") && !User.IsInRole("HR"))
        {
            return Forbid();
        }

        return Ok(await _db.SalaryHistory
            .Where(s => s.EmployeeId == employeeId)
            .OrderByDescending(s => s.EffectiveDate)
            .ToListAsync());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] SalaryHistoryCreateDto dto)
    {
        var employee = await _db.Employees.FindAsync(dto.EmployeeId);
        if (employee is null) return BadRequest("Employee not found");

        var entry = new SalaryHistory
        {
            EmployeeId = dto.EmployeeId,
            OldSalary = employee.Salary,
            NewSalary = dto.NewSalary,
            EffectiveDate = dto.EffectiveDate,
            Reason = dto.Reason,
            CreatedAt = DateTime.UtcNow,
        };

        employee.Salary = dto.NewSalary;
        _db.SalaryHistory.Add(entry);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByEmployee), new { employeeId = dto.EmployeeId }, entry);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await _db.SalaryHistory.FindAsync(id);
        if (entry is null) return NotFound();
        _db.SalaryHistory.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int? GetLinkedEmployeeId()
    {
        var claim = User.FindFirst("employeeId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }
}

public record SalaryHistoryCreateDto(int EmployeeId, decimal NewSalary, DateOnly EffectiveDate, string? Reason);
