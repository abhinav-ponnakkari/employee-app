using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,HR")]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _db;
    public AttendanceController(AppDbContext db) => _db = db;

    // GET /api/attendance/report?month=4&year=2026
    [HttpGet("report")]
    public async Task<IActionResult> Report([FromQuery] int? month, [FromQuery] int? year)
    {
        var m = month ?? DateTime.UtcNow.Month;
        var y = year ?? DateTime.UtcNow.Year;

        var startUtc = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
        var endUtc = startUtc.AddMonths(1);

        var employees = await _db.Employees.AsNoTracking()
            .Where(e => e.Status == null || e.Status == "Active")
            .OrderBy(e => e.FirstName)
            .Select(e => new { e.Id, e.FirstName, e.LastName, e.Department, e.Position })
            .ToListAsync();

        var punches = await _db.PunchRecords.AsNoTracking()
            .Where(p => p.PunchIn >= startUtc && p.PunchIn < endUtc)
            .ToListAsync();

        // Working days in month (Mon–Fri)
        var workingDays = Enumerable.Range(0, (endUtc - startUtc).Days)
            .Select(i => startUtc.AddDays(i))
            .Count(d => d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday);

        var report = employees.Select(emp =>
        {
            var empPunches = punches.Where(p => p.EmployeeId == emp.Id).ToList();
            var presentDays = empPunches.Select(p => p.PunchIn.Date).Distinct().Count();
            var lateDays = empPunches.Count(p => p.PunchIn.Hour > 9 || (p.PunchIn.Hour == 9 && p.PunchIn.Minute > 0));
            var totalHours = empPunches
                .Where(p => p.PunchOut.HasValue)
                .Sum(p => (p.PunchOut!.Value - p.PunchIn).TotalHours);
            var overtimeHours = empPunches
                .Where(p => p.PunchOut.HasValue)
                .Sum(p => Math.Max(0, (p.PunchOut!.Value - p.PunchIn).TotalHours - 8));

            return new
            {
                emp.Id,
                emp.FirstName,
                emp.LastName,
                emp.Department,
                emp.Position,
                WorkingDays = workingDays,
                PresentDays = presentDays,
                AbsentDays = Math.Max(0, workingDays - presentDays),
                LateDays = lateDays,
                TotalHours = Math.Round(totalHours, 1),
                OvertimeHours = Math.Round(overtimeHours, 1),
                AttendancePct = workingDays > 0 ? Math.Round((double)presentDays / workingDays * 100, 1) : 0,
            };
        });

        return Ok(new { month = m, year = y, workingDays, employees = report });
    }

    // GET /api/attendance/today — who is currently punched in
    [HttpGet("today")]
    public async Task<IActionResult> Today()
    {
        var todayUtc = DateTime.UtcNow.Date;
        var tomorrowUtc = todayUtc.AddDays(1);

        var punched = await _db.PunchRecords.AsNoTracking()
            .Where(p => p.PunchIn >= todayUtc && p.PunchIn < tomorrowUtc)
            .Join(_db.Employees.AsNoTracking(),
                p => p.EmployeeId,
                e => e.Id,
                (p, e) => new
                {
                    e.Id,
                    e.FirstName,
                    e.LastName,
                    e.Department,
                    PunchIn = p.PunchIn,
                    PunchOut = p.PunchOut,
                    IsIn = p.PunchOut == null,
                })
            .OrderBy(x => x.PunchIn)
            .ToListAsync();

        return Ok(punched);
    }

    // GET /api/attendance/employee/{id}?month=4&year=2026
    [HttpGet("employee/{id}")]
    public async Task<IActionResult> EmployeeDetail(int id, [FromQuery] int? month, [FromQuery] int? year)
    {
        var m = month ?? DateTime.UtcNow.Month;
        var y = year ?? DateTime.UtcNow.Year;
        var startUtc = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
        var endUtc = startUtc.AddMonths(1);

        var punches = await _db.PunchRecords.AsNoTracking()
            .Where(p => p.EmployeeId == id && p.PunchIn >= startUtc && p.PunchIn < endUtc)
            .OrderBy(p => p.PunchIn)
            .Select(p => new
            {
                p.Id,
                p.PunchIn,
                p.PunchOut,
                HoursWorked = p.PunchOut.HasValue
                    ? Math.Round((p.PunchOut.Value - p.PunchIn).TotalHours, 2)
                    : (double?)null,
                IsLate = p.PunchIn.Hour > 9 || (p.PunchIn.Hour == 9 && p.PunchIn.Minute > 0),
                Overtime = p.PunchOut.HasValue
                    ? Math.Round(Math.Max(0, (p.PunchOut.Value - p.PunchIn).TotalHours - 8), 2)
                    : 0.0,
            })
            .ToListAsync();

        return Ok(new { employeeId = id, month = m, year = y, records = punches });
    }
}
