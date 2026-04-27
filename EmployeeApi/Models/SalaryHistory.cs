namespace EmployeeApi.Models;

public class SalaryHistory
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public decimal OldSalary { get; set; }
    public decimal NewSalary { get; set; }
    public DateOnly EffectiveDate { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
