using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/employee-of-month")]
[Authorize]
public class EmployeeOfMonthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? year)
    {
        var q = db.EmployeeOfMonth.AsQueryable();
        if (year.HasValue) q = q.Where(e => e.Year == year.Value);
        var list = await q.OrderByDescending(e => e.Year).ThenByDescending(e => e.Month).ToListAsync();

        var employeeIds = list.Select(e => e.EmployeeId).Distinct().ToList();
        var employees = await db.Employees
            .Where(e => employeeIds.Contains(e.Id))
            .Select(e => new { e.Id, Name = e.FirstName + " " + e.LastName, e.Department, e.Position, e.PhotoUrl })
            .ToDictionaryAsync(e => e.Id);

        var result = list.Select(e => new
        {
            e.Id, e.Month, e.Year, e.Reason, e.NominatedBy, e.CreatedAt,
            Employee = employees.GetValueOrDefault(e.EmployeeId)
        });
        return Ok(result);
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent()
    {
        var now = DateTime.UtcNow;
        var entry = await db.EmployeeOfMonth
            .FirstOrDefaultAsync(e => e.Month == now.Month && e.Year == now.Year);
        if (entry == null) return Ok(null);

        var emp = await db.Employees
            .Where(e => e.Id == entry.EmployeeId)
            .Select(e => new { e.Id, Name = e.FirstName + " " + e.LastName, e.Department, e.Position, e.PhotoUrl })
            .FirstOrDefaultAsync();

        return Ok(new { entry.Id, entry.Month, entry.Year, entry.Reason, entry.NominatedBy, entry.CreatedAt, Employee = emp });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Nominate([FromBody] NominateRequest req)
    {
        var exists = await db.EmployeeOfMonth
            .AnyAsync(e => e.Month == req.Month && e.Year == req.Year);
        if (exists) return Conflict("Employee of the Month already set for this period.");

        var emp = await db.Employees.FindAsync(req.EmployeeId);
        if (emp == null) return NotFound("Employee not found.");

        var entry = new EmployeeOfMonth
        {
            EmployeeId = req.EmployeeId,
            Month = req.Month,
            Year = req.Year,
            Reason = req.Reason,
            NominatedBy = User.Identity?.Name ?? "HR"
        };
        db.EmployeeOfMonth.Add(entry);
        await db.SaveChangesAsync();
        return Ok(entry);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await db.EmployeeOfMonth.FindAsync(id);
        if (entry == null) return NotFound();
        db.EmployeeOfMonth.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record NominateRequest(int EmployeeId, int Month, int Year, string Reason);
