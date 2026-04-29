using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/mood")]
[Authorize]
public class MoodController(AppDbContext db) : ControllerBase
{
    private int? MyEmployeeId => int.TryParse(
        User.FindFirst("employeeId")?.Value, out var id) ? id : null;

    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var empId = MyEmployeeId;
        if (empId == null) return BadRequest("No employee linked.");
        var checkins = await db.MoodCheckins
            .Where(m => m.EmployeeId == empId)
            .OrderByDescending(m => m.Week)
            .Take(12)
            .ToListAsync();
        return Ok(checkins);
    }

    [HttpPost]
    public async Task<IActionResult> CheckIn([FromBody] MoodCheckinRequest req)
    {
        var empId = MyEmployeeId;
        if (empId == null) return BadRequest("No employee linked.");
        if (req.Rating < 1 || req.Rating > 5) return BadRequest("Rating must be 1–5.");

        var monday = GetMonday(DateOnly.FromDateTime(DateTime.UtcNow));
        var existing = await db.MoodCheckins
            .FirstOrDefaultAsync(m => m.EmployeeId == empId && m.Week == monday);

        if (existing != null)
        {
            existing.Rating = req.Rating;
            existing.Note = req.Note;
        }
        else
        {
            db.MoodCheckins.Add(new MoodCheckin
            {
                EmployeeId = empId.Value,
                Rating = req.Rating,
                Note = req.Note,
                Week = monday
            });
        }
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("team-pulse")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> TeamPulse([FromQuery] int weeks = 8)
    {
        var since = GetMonday(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-weeks * 7)));
        var data = await db.MoodCheckins
            .Where(m => m.Week >= since)
            .GroupBy(m => m.Week)
            .Select(g => new
            {
                Week = g.Key,
                AvgRating = Math.Round(g.Average(m => (double)m.Rating), 2),
                Count = g.Count()
            })
            .OrderBy(g => g.Week)
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("distribution")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Distribution()
    {
        var monday = GetMonday(DateOnly.FromDateTime(DateTime.UtcNow));
        var data = await db.MoodCheckins
            .Where(m => m.Week == monday)
            .GroupBy(m => m.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync();
        return Ok(data);
    }

    private static DateOnly GetMonday(DateOnly d)
    {
        var dow = (int)d.DayOfWeek;
        var diff = dow == 0 ? -6 : 1 - dow;
        return d.AddDays(diff);
    }
}

public record MoodCheckinRequest(int Rating, string? Note);
