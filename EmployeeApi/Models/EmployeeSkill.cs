namespace EmployeeApi.Models;

public class EmployeeSkill
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string Name { get; set; } = "";
    public string Category { get; set; } = "Skill"; // Skill | Certification | Language | Tool
    public string? Level { get; set; } // Beginner | Intermediate | Expert
    public DateOnly? ExpiryDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
