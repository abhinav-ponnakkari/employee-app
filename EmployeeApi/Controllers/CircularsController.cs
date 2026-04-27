using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CircularsController : ControllerBase
{
    private readonly AppDbContext _db;
    public CircularsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Circulars
            .Where(c => c.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Circulars.FindAsync(id);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] Circular circular)
    {
        circular.CreatedAt = DateTime.UtcNow;
        circular.IsActive = true;
        _db.Circulars.Add(circular);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = circular.Id }, circular);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var circular = await _db.Circulars.FindAsync(id);
        if (circular is null) return NotFound();
        circular.IsActive = false; // soft delete
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
