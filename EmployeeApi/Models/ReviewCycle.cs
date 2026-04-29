namespace EmployeeApi.Models;

public class ReviewCycle
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Type { get; set; } = "Annual"; // Annual, Quarterly, Mid-Year
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Closed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "";
    public List<PerformanceReview> Reviews { get; set; } = [];
}
