using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitFeedbackRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest("Content required.");
        var fb = new AnonymousFeedback
        {
            Content = req.Content,
            Category = req.Category ?? "General"
        };
        db.AnonymousFeedbacks.Add(fb);
        await db.SaveChangesAsync();
        return Ok(new { fb.Id });
    }

    [HttpGet]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetAll([FromQuery] bool? unread, [FromQuery] string? category)
    {
        var q = db.AnonymousFeedbacks.AsQueryable();
        if (unread == true) q = q.Where(f => !f.IsRead);
        if (!string.IsNullOrEmpty(category)) q = q.Where(f => f.Category == category);
        var list = await q.OrderByDescending(f => f.CreatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpPatch("{id}/read")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var fb = await db.AnonymousFeedbacks.FindAsync(id);
        if (fb == null) return NotFound();
        fb.IsRead = true;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/reply")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Reply(int id, [FromBody] ReplyRequest req)
    {
        var fb = await db.AnonymousFeedbacks.FindAsync(id);
        if (fb == null) return NotFound();
        fb.HrReply = req.Reply;
        fb.RepliedAt = DateTime.UtcNow;
        fb.IsRead = true;
        await db.SaveChangesAsync();
        return Ok(fb);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var fb = await db.AnonymousFeedbacks.FindAsync(id);
        if (fb == null) return NotFound();
        db.AnonymousFeedbacks.Remove(fb);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Stats()
    {
        var total = await db.AnonymousFeedbacks.CountAsync();
        var unread = await db.AnonymousFeedbacks.CountAsync(f => !f.IsRead);
        var byCat = await db.AnonymousFeedbacks
            .GroupBy(f => f.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToListAsync();
        return Ok(new { Total = total, Unread = unread, ByCategory = byCat });
    }
}

public record SubmitFeedbackRequest(string Content, string? Category);
public record ReplyRequest(string Reply);
