using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/skills")]
[Authorize]
public class SkillsController(AppDbContext db) : ControllerBase
{
    private int? MyEmployeeId => int.TryParse(
        User.FindFirst("employeeId")?.Value, out var id) ? id : null;

    [HttpGet("employee/{employeeId}")]
    public async Task<IActionResult> GetForEmployee(int employeeId)
    {
        var skills = await db.EmployeeSkills
            .Where(s => s.EmployeeId == employeeId)
            .OrderBy(s => s.Category).ThenBy(s => s.Name)
            .ToListAsync();
        return Ok(skills);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var empId = MyEmployeeId;
        if (empId == null) return BadRequest("No employee linked.");
        var skills = await db.EmployeeSkills
            .Where(s => s.EmployeeId == empId)
            .OrderBy(s => s.Category).ThenBy(s => s.Name)
            .ToListAsync();
        return Ok(skills);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddSkillRequest req)
    {
        var empId = MyEmployeeId;
        var isAdminHr = User.IsInRole("Admin") || User.IsInRole("HR");

        var targetId = isAdminHr && req.EmployeeId.HasValue ? req.EmployeeId.Value : empId ?? 0;
        if (targetId == 0) return BadRequest("No employee linked.");

        var skill = new EmployeeSkill
        {
            EmployeeId = targetId,
            Name = req.Name,
            Category = req.Category,
            Level = req.Level,
            ExpiryDate = req.ExpiryDate
        };
        db.EmployeeSkills.Add(skill);
        await db.SaveChangesAsync();
        return Ok(skill);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AddSkillRequest req)
    {
        var skill = await db.EmployeeSkills.FindAsync(id);
        if (skill == null) return NotFound();

        var empId = MyEmployeeId;
        var isAdminHr = User.IsInRole("Admin") || User.IsInRole("HR");
        if (!isAdminHr && skill.EmployeeId != empId) return Forbid();

        skill.Name = req.Name;
        skill.Category = req.Category;
        skill.Level = req.Level;
        skill.ExpiryDate = req.ExpiryDate;
        await db.SaveChangesAsync();
        return Ok(skill);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var skill = await db.EmployeeSkills.FindAsync(id);
        if (skill == null) return NotFound();

        var empId = MyEmployeeId;
        var isAdminHr = User.IsInRole("Admin") || User.IsInRole("HR");
        if (!isAdminHr && skill.EmployeeId != empId) return Forbid();

        db.EmployeeSkills.Remove(skill);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("expiring")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Expiring([FromQuery] int days = 30)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(days));
        var skills = await db.EmployeeSkills
            .Where(s => s.ExpiryDate != null && s.ExpiryDate <= cutoff)
            .OrderBy(s => s.ExpiryDate)
            .ToListAsync();

        var empIds = skills.Select(s => s.EmployeeId).Distinct().ToList();
        var employees = await db.Employees
            .Where(e => empIds.Contains(e.Id))
            .Select(e => new { e.Id, e.Name, e.Department })
            .ToDictionaryAsync(e => e.Id);

        var result = skills.Select(s => new
        {
            s.Id, s.Name, s.Category, s.Level, s.ExpiryDate,
            Employee = employees.GetValueOrDefault(s.EmployeeId)
        });
        return Ok(result);
    }
}

public record AddSkillRequest(string Name, string Category, string? Level, DateOnly? ExpiryDate, int? EmployeeId);
