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
public class CircularsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EmailService _email;

    public CircularsController(AppDbContext db, EmailService email)
    {
        _db = db;
        _email = email;
    }

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

        // Send announcement email to all active employees with emails (fire-and-forget)
        var emails = await _db.Employees.AsNoTracking()
            .Where(e => (e.Status == null || e.Status == "Active") && e.Email != null && e.Email != "")
            .Select(e => e.Email!)
            .ToListAsync();

        if (emails.Count > 0)
        {
            var postedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "HR";
            var (subject, html) = EmailTemplates.NewCircular(
                circular.Title,
                circular.Content,
                postedBy,
                circular.CreatedAt.ToString("MMM d, yyyy"));
            _ = _email.SendToManyAsync(emails, subject, html);
        }

        return CreatedAtAction(nameof(GetById), new { id = circular.Id }, circular);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var circular = await _db.Circulars.FindAsync(id);
        if (circular is null) return NotFound();
        circular.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
