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

    [HttpGet("org-chart")]
    public async Task<IActionResult> OrgChart()
    {
        var employees = await _db.Employees
            .Where(e => e.IsActive)
            .Select(e => new { e.Id, e.Name, e.Position, e.Department, e.PhotoUrl, e.ManagerId })
            .ToListAsync();
        return Ok(employees);
    }

    [HttpGet("birthdays")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Birthdays([FromQuery] int days = 30)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var employees = await _db.Employees
            .Where(e => e.IsActive && e.DateOfBirth != null)
            .Select(e => new { e.Id, e.Name, e.Department, e.Position, e.PhotoUrl, e.DateOfBirth, e.HireDate })
            .ToListAsync();

        var upcoming = employees
            .Select(e =>
            {
                var bd = e.DateOfBirth!.Value;
                var thisYear = new DateOnly(today.Year, bd.Month, bd.Day);
                if (thisYear < today) thisYear = new DateOnly(today.Year + 1, bd.Month, bd.Day);
                var daysUntil = thisYear.DayNumber - today.DayNumber;

                var hd = e.HireDate;
                var yearsOfService = today.Year - hd.Year - (today < new DateOnly(today.Year, hd.Month, hd.Day) ? 1 : 0);
                var annivThisYear = new DateOnly(today.Year, hd.Month, hd.Day);
                if (annivThisYear < today) annivThisYear = new DateOnly(today.Year + 1, hd.Month, hd.Day);
                var daysUntilAnniv = annivThisYear.DayNumber - today.DayNumber;

                return new
                {
                    e.Id, e.Name, e.Department, e.Position, e.PhotoUrl,
                    BirthdayDate = new DateOnly(today.Year, bd.Month, bd.Day),
                    DaysUntilBirthday = daysUntil,
                    AnniversaryDate = annivThisYear,
                    DaysUntilAnniversary = daysUntilAnniv,
                    YearsOfService = yearsOfService
                };
            })
            .Where(e => e.DaysUntilBirthday <= days || e.DaysUntilAnniversary <= days)
            .OrderBy(e => Math.Min(e.DaysUntilBirthday, e.DaysUntilAnniversary))
            .ToList();

        return Ok(upcoming);
    }

    private int? GetLinkedEmployeeId()
    {
        var claim = User.FindFirst("employeeId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }
}
