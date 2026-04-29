using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HolidaysController : ControllerBase
{
    private readonly AppDbContext _db;
    public HolidaysController(AppDbContext db) => _db = db;

    // GET /api/holidays?year=2026
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? year)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var all = await _db.PublicHolidays.AsNoTracking().ToListAsync();

        // For recurring holidays, show them for the requested year
        var result = all.Select(h => new
        {
            h.Id,
            h.Name,
            h.IsRecurring,
            Date = h.IsRecurring
                ? new DateOnly(targetYear, h.Date.Month, h.Date.Day)
                : h.Date,
        }).OrderBy(h => h.Date).ToList();

        return Ok(result);
    }

    // GET /api/holidays/check?start=2026-04-01&end=2026-04-10
    [HttpGet("check")]
    public async Task<IActionResult> CheckRange([FromQuery] DateOnly start, [FromQuery] DateOnly end)
    {
        var year = start.Year;
        var all = await _db.PublicHolidays.AsNoTracking().ToListAsync();

        var overlapping = all
            .Select(h => h.IsRecurring ? new DateOnly(year, h.Date.Month, h.Date.Day) : h.Date)
            .Where(d => d >= start && d <= end)
            .ToList();

        return Ok(overlapping);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] PublicHoliday holiday)
    {
        _db.PublicHolidays.Add(holiday);
        await _db.SaveChangesAsync();
        return Ok(holiday);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(int id, [FromBody] PublicHoliday dto)
    {
        var h = await _db.PublicHolidays.FindAsync(id);
        if (h is null) return NotFound();
        h.Name = dto.Name;
        h.Date = dto.Date;
        h.IsRecurring = dto.IsRecurring;
        await _db.SaveChangesAsync();
        return Ok(h);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var h = await _db.PublicHolidays.FindAsync(id);
        if (h is null) return NotFound();
        _db.PublicHolidays.Remove(h);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
