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
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public EmployeesController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Employees.ToListAsync());

    // Employee role: get own profile
    [HttpGet("me")]
    [Authorize(Roles = "Employee")]
    public async Task<IActionResult> GetMe()
    {
        var empId = GetLinkedEmployeeId();
        if (empId is null) return NotFound(new { message = "No employee record linked to your account." });
        var employee = await _db.Employees.FindAsync(empId.Value);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetById(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create(Employee employee)
    {
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Created", "Employee", employee.Id, username, $"{employee.FirstName} {employee.LastName}");

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(int id, Employee employee)
    {
        if (id != employee.Id) return BadRequest();
        _db.Entry(employee).State = EntityState.Modified;
        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _db.Employees.AnyAsync(e => e.Id == id)) return NotFound();
            throw;
        }

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Updated", "Employee", id, username, $"{employee.FirstName} {employee.LastName}");

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee is null) return NotFound();
        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Deleted", "Employee", id, username, $"ID {id}");

        return NoContent();
    }

    private int? GetLinkedEmployeeId()
    {
        var claim = User.FindFirst("employeeId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }
}
