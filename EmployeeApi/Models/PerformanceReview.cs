namespace EmployeeApi.Models;

public class PerformanceReview
{
    public int Id { get; set; }
    public int CycleId { get; set; }
    public int EmployeeId { get; set; }
    public int? OverallRating { get; set; } // 1–5
    public string? Goals { get; set; }
    public string? ManagerComments { get; set; }
    public string? SelfAssessment { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public ReviewCycle Cycle { get; set; } = null!;
}
