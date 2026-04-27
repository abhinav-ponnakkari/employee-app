using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private const string CacheKey = "departments";

    public DepartmentsController(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (_cache.TryGetValue(CacheKey, out List<Department>? cached))
            return Ok(cached);

        var depts = await _db.Departments.AsNoTracking().OrderBy(d => d.Name).ToListAsync();
        _cache.Set(CacheKey, depts, TimeSpan.FromMinutes(10));
        return Ok(depts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dept = await _db.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        return dept is null ? NotFound() : Ok(dept);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(Department dept)
    {
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();
        _cache.Remove(CacheKey);
        return CreatedAtAction(nameof(GetById), new { id = dept.Id }, dept);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, Department dept)
    {
        if (id != dept.Id) return BadRequest();
        _db.Entry(dept).State = EntityState.Modified;
        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _db.Departments.AnyAsync(d => d.Id == id)) return NotFound();
            throw;
        }
        _cache.Remove(CacheKey);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var dept = await _db.Departments.FindAsync(id);
        if (dept is null) return NotFound();
        _db.Departments.Remove(dept);
        await _db.SaveChangesAsync();
        _cache.Remove(CacheKey);
        return NoContent();
    }
}
