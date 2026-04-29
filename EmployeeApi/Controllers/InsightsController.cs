using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Services;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/insights")]
[Authorize(Roles = "Admin,HR")]
public class InsightsController(AppDbContext db, ChatService chat) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetInsights()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalEmployees = await db.Employees.CountAsync(e => (e.Status ?? "Active") != "Terminated");
        var pendingLeaves = await db.LeaveRequests.CountAsync(l => l.Status == "Pending");
        var approvedLeavesThisMonth = await db.LeaveRequests
            .CountAsync(l => l.Status == "Approved" && l.CreatedAt >= monthStart);
        var avgMoodThisWeek = await db.MoodCheckins
            .Where(m => m.Week == DateOnly.FromDateTime(now))
            .Select(m => (double?)m.Rating)
            .AverageAsync() ?? 0;
        var openFeedback = await db.AnonymousFeedbacks.CountAsync(f => !f.IsRead);
        var expiringCerts = await db.EmployeeSkills
            .CountAsync(s => s.ExpiryDate != null && s.ExpiryDate <= DateOnly.FromDateTime(now.AddDays(30)));

        var summary = $@"HR snapshot for {now:MMMM yyyy}:
- Active employees: {totalEmployees}
- Pending leave requests: {pendingLeaves}
- Approved leaves this month: {approvedLeavesThisMonth}
- Average team mood this week: {avgMoodThisWeek:F1}/5
- Unread anonymous feedback: {openFeedback}
- Certifications expiring in 30 days: {expiringCerts}

Provide 3 short, actionable insights for the HR team based on these numbers. Be concise and practical.";

        var insight = await chat.GetInsightAsync(summary);
        return Ok(new
        {
            Stats = new
            {
                TotalEmployees = totalEmployees,
                PendingLeaves = pendingLeaves,
                ApprovedLeavesThisMonth = approvedLeavesThisMonth,
                AvgMood = Math.Round(avgMoodThisWeek, 1),
                OpenFeedback = openFeedback,
                ExpiringCerts = expiringCerts
            },
            Insights = insight
        });
    }
}
