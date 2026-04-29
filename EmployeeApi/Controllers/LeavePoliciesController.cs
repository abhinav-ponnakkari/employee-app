using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeavePoliciesController : ControllerBase
{
    private readonly AppDbContext _db;
    public LeavePoliciesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.LeavePolicies.AsNoTracking().OrderBy(p => p.LeaveType).ToListAsync());

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] LeavePolicy policy)
    {
        _db.LeavePolicies.Add(policy);
        await _db.SaveChangesAsync();
        return Ok(policy);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(int id, [FromBody] LeavePolicy dto)
    {
        var policy = await _db.LeavePolicies.FindAsync(id);
        if (policy is null) return NotFound();
        policy.LeaveType = dto.LeaveType;
        policy.EntitlementDays = dto.EntitlementDays;
        policy.Description = dto.Description;
        await _db.SaveChangesAsync();
        return Ok(policy);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var policy = await _db.LeavePolicies.FindAsync(id);
        if (policy is null) return NotFound();
        _db.LeavePolicies.Remove(policy);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/leavepolicies/balance/{employeeId}?year=2026
    [HttpGet("balance/{employeeId}")]
    public async Task<IActionResult> GetBalance(int employeeId, [FromQuery] int? year)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var policies = await _db.LeavePolicies.AsNoTracking().ToListAsync();
        var used = await _db.LeaveRequests.AsNoTracking()
            .Where(r => r.EmployeeId == employeeId
                     && r.Status == "Approved"
                     && r.StartDate.Year == targetYear)
            .ToListAsync();

        var balance = policies.Select(p =>
        {
            var usedDays = used
                .Where(r => r.LeaveType == p.LeaveType)
                .Sum(r => (r.EndDate.DayNumber - r.StartDate.DayNumber + 1));
            return new
            {
                p.LeaveType,
                p.EntitlementDays,
                UsedDays = usedDays,
                RemainingDays = Math.Max(0, p.EntitlementDays - usedDays),
            };
        });

        return Ok(balance);
    }
}
