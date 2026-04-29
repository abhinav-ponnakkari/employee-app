using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewCyclesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReviewCyclesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cycles = await _db.ReviewCycles.AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new { c.Id, c.Title, c.Type, c.StartDate, c.EndDate, c.Status, c.CreatedAt, c.CreatedBy })
            .ToListAsync();
        return Ok(cycles);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cycle = await _db.ReviewCycles
            .Include(c => c.Reviews)
            .FirstOrDefaultAsync(c => c.Id == id);
        return cycle is null ? NotFound() : Ok(cycle);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] ReviewCycle dto)
    {
        dto.CreatedAt = DateTime.UtcNow;
        dto.CreatedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        dto.Status = "Active";
        _db.ReviewCycles.Add(dto);
        await _db.SaveChangesAsync();
        return Ok(dto);
    }

    [HttpPatch("{id}/close")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Close(int id)
    {
        var cycle = await _db.ReviewCycles.FindAsync(id);
        if (cycle is null) return NotFound();
        cycle.Status = "Closed";
        await _db.SaveChangesAsync();
        return Ok(cycle);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var cycle = await _db.ReviewCycles.FindAsync(id);
        if (cycle is null) return NotFound();
        _db.ReviewCycles.Remove(cycle);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Reviews within a cycle ───────────────────────────────────────────────

    // GET /api/reviewcycles/{cycleId}/reviews?employeeId=
    [HttpGet("{cycleId}/reviews")]
    public async Task<IActionResult> GetReviews(int cycleId, [FromQuery] int? employeeId)
    {
        if (User.IsInRole("Employee"))
        {
            var myEmpId = GetLinkedEmployeeId();
            if (myEmpId is null) return Ok(Array.Empty<PerformanceReview>());
            return Ok(await _db.PerformanceReviews.AsNoTracking()
                .Where(r => r.CycleId == cycleId && r.EmployeeId == myEmpId.Value)
                .ToListAsync());
        }

        var query = _db.PerformanceReviews.AsNoTracking().Where(r => r.CycleId == cycleId);
        if (employeeId.HasValue) query = query.Where(r => r.EmployeeId == employeeId.Value);
        return Ok(await query.ToListAsync());
    }

    [HttpPost("{cycleId}/reviews")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> CreateReview(int cycleId, [FromBody] PerformanceReview dto)
    {
        if (!await _db.ReviewCycles.AnyAsync(c => c.Id == cycleId)) return NotFound();
        if (await _db.PerformanceReviews.AnyAsync(r => r.CycleId == cycleId && r.EmployeeId == dto.EmployeeId))
            return BadRequest(new { message = "Review already exists for this employee in this cycle." });

        dto.CycleId = cycleId;
        dto.CreatedAt = DateTime.UtcNow;
        dto.Status = "Pending";
        _db.PerformanceReviews.Add(dto);
        await _db.SaveChangesAsync();
        return Ok(dto);
    }

    [HttpPut("{cycleId}/reviews/{reviewId}")]
    [Authorize(Roles = "Admin,HR,Employee")]
    public async Task<IActionResult> UpdateReview(int cycleId, int reviewId, [FromBody] UpdateReviewDto dto)
    {
        var review = await _db.PerformanceReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.CycleId == cycleId);
        if (review is null) return NotFound();

        if (User.IsInRole("Employee"))
        {
            // Employees can only update their own self-assessment
            if (review.EmployeeId != GetLinkedEmployeeId()) return Forbid();
            review.SelfAssessment = dto.SelfAssessment;
        }
        else
        {
            review.OverallRating = dto.OverallRating;
            review.Goals = dto.Goals;
            review.ManagerComments = dto.ManagerComments;
            review.SelfAssessment = dto.SelfAssessment ?? review.SelfAssessment;
            if (dto.OverallRating.HasValue)
            {
                review.Status = "Completed";
                review.CompletedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(review);
    }

    [HttpDelete("{cycleId}/reviews/{reviewId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteReview(int cycleId, int reviewId)
    {
        var review = await _db.PerformanceReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.CycleId == cycleId);
        if (review is null) return NotFound();
        _db.PerformanceReviews.Remove(review);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/reviewcycles/myreviews — Employee sees all their reviews across cycles
    [HttpGet("myreviews")]
    [Authorize(Roles = "Employee")]
    public async Task<IActionResult> MyReviews()
    {
        var myEmpId = GetLinkedEmployeeId();
        if (myEmpId is null) return Ok(Array.Empty<object>());

        var reviews = await _db.PerformanceReviews.AsNoTracking()
            .Include(r => r.Cycle)
            .Where(r => r.EmployeeId == myEmpId.Value)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return Ok(reviews);
    }

    private int? GetLinkedEmployeeId()
    {
        var claim = User.FindFirst("employeeId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }
}

public record UpdateReviewDto(int? OverallRating, string? Goals, string? ManagerComments, string? SelfAssessment);
