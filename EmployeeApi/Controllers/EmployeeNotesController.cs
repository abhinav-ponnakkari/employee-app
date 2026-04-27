using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeNotesController : ControllerBase
{
    private readonly AppDbContext _db;
    public EmployeeNotesController(AppDbContext db) => _db = db;

    [HttpGet("employee/{employeeId}")]
    public async Task<IActionResult> GetByEmployee(int employeeId) =>
        Ok(await _db.EmployeeNotes
            .Where(n => n.EmployeeId == employeeId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create(EmployeeNote note)
    {
        note.CreatedAt = DateTime.UtcNow;
        _db.EmployeeNotes.Add(note);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetByEmployee), new { employeeId = note.EmployeeId }, note);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var note = await _db.EmployeeNotes.FindAsync(id);
        if (note is null) return NotFound();
        _db.EmployeeNotes.Remove(note);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
