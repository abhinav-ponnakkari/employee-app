namespace EmployeeApi.Models;

public class EmployeeOfMonth
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string Reason { get; set; } = "";
    public string NominatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
