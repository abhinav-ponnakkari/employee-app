using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PunchRecordsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PunchRecordsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? employeeId)
    {
        if (User.IsInRole("Employee"))
        {
            var myId = GetLinkedEmployeeId();
            if (myId is null) return Ok(Array.Empty<PunchRecord>());
            return Ok(await _db.PunchRecords
                .Where(p => p.EmployeeId == myId.Value)
                .OrderByDescending(p => p.PunchIn)
                .ToListAsync());
        }

        var query = _db.PunchRecords.AsQueryable();
        if (employeeId.HasValue) query = query.Where(p => p.EmployeeId == employeeId.Value);
        return Ok(await query.OrderByDescending(p => p.PunchIn).ToListAsync());
    }

    // Employee punches themselves in
    [HttpPost("punchin")]
    [Authorize(Roles = "Employee")]
    public async Task<IActionResult> PunchIn()
    {
        var myId = GetLinkedEmployeeId();
        if (myId is null) return BadRequest(new { message = "No employee record linked to your account." });

        // Allow only one open punch per day
        var today = DateTime.UtcNow.Date;
        var existing = await _db.PunchRecords.FirstOrDefaultAsync(p =>
            p.EmployeeId == myId.Value && p.PunchIn.Date == today && p.PunchOut == null);
        if (existing is not null)
            return BadRequest(new { message = "You are already punched in today." });

        var record = new PunchRecord { EmployeeId = myId.Value, PunchIn = DateTime.UtcNow };
        _db.PunchRecords.Add(record);
        await _db.SaveChangesAsync();
        return Ok(record);
    }

    // Employee punches themselves out
    [HttpPatch("{id}/punchout")]
    [Authorize(Roles = "Employee")]
    public async Task<IActionResult> PunchOut(int id)
    {
        var myId = GetLinkedEmployeeId();
        var record = await _db.PunchRecords.FindAsync(id);
        if (record is null) return NotFound();
        if (record.EmployeeId != myId) return Forbid();
        if (record.PunchOut is not null) return BadRequest(new { message = "Already punched out." });

        record.PunchOut = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(record);
    }

    // Admin/HR manual entry
    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] PunchRecord record)
    {
        _db.PunchRecords.Add(record);
        await _db.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _db.PunchRecords.FindAsync(id);
        if (record is null) return NotFound();
        _db.PunchRecords.Remove(record);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int? GetLinkedEmployeeId()
    {
        var claim = User.FindFirst("employeeId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }
}
