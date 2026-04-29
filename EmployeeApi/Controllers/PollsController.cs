using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/polls")]
[Authorize]
public class PollsController(AppDbContext db) : ControllerBase
{
    private int? MyEmployeeId => int.TryParse(
        User.FindFirst("employeeId")?.Value, out var id) ? id : null;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var empId = MyEmployeeId;
        var polls = await db.Polls
            .Where(p => p.IsActive && (p.ExpiresAt == null || p.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var pollIds = polls.Select(p => p.Id).ToList();
        var votes = await db.PollVotes.Where(v => pollIds.Contains(v.PollId)).ToListAsync();

        var result = polls.Select(p =>
        {
            var options = JsonSerializer.Deserialize<List<string>>(p.OptionsJson) ?? [];
            var pollVotes = votes.Where(v => v.PollId == p.Id).ToList();
            var tally = options.Select((opt, i) => new
            {
                Index = i,
                Option = opt,
                Count = pollVotes.Count(v => v.OptionIndex == i)
            }).ToList();
            var myVote = empId.HasValue ? pollVotes.FirstOrDefault(v => v.EmployeeId == empId.Value) : null;
            return new
            {
                p.Id, p.Question, p.CreatedBy, p.CreatedAt, p.ExpiresAt,
                Options = options,
                Tally = tally,
                TotalVotes = pollVotes.Count,
                MyVoteIndex = myVote?.OptionIndex
            };
        });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] CreatePollRequest req)
    {
        if (req.Options.Count < 2) return BadRequest("Need at least 2 options.");
        var poll = new Poll
        {
            Question = req.Question,
            OptionsJson = JsonSerializer.Serialize(req.Options),
            CreatedBy = User.Identity?.Name ?? "HR",
            ExpiresAt = req.ExpiresAt
        };
        db.Polls.Add(poll);
        await db.SaveChangesAsync();
        return Ok(poll);
    }

    [HttpPost("{id}/vote")]
    public async Task<IActionResult> Vote(int id, [FromBody] VoteRequest req)
    {
        var empId = MyEmployeeId;
        if (empId == null) return BadRequest("No employee linked.");

        var poll = await db.Polls.FindAsync(id);
        if (poll == null) return NotFound();
        if (!poll.IsActive) return BadRequest("Poll is closed.");
        if (poll.ExpiresAt.HasValue && poll.ExpiresAt < DateTime.UtcNow) return BadRequest("Poll has expired.");

        var options = JsonSerializer.Deserialize<List<string>>(poll.OptionsJson) ?? [];
        if (req.OptionIndex < 0 || req.OptionIndex >= options.Count) return BadRequest("Invalid option.");

        var existing = await db.PollVotes.FirstOrDefaultAsync(v => v.PollId == id && v.EmployeeId == empId.Value);
        if (existing != null)
        {
            existing.OptionIndex = req.OptionIndex;
        }
        else
        {
            db.PollVotes.Add(new PollVote { PollId = id, EmployeeId = empId.Value, OptionIndex = req.OptionIndex });
        }
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPatch("{id}/close")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Close(int id)
    {
        var poll = await db.Polls.FindAsync(id);
        if (poll == null) return NotFound();
        poll.IsActive = false;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var poll = await db.Polls.FindAsync(id);
        if (poll == null) return NotFound();
        db.Polls.Remove(poll);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreatePollRequest(string Question, List<string> Options, DateTime? ExpiresAt);
public record VoteRequest(int OptionIndex);
