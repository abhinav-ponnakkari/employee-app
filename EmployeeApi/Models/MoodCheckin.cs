namespace EmployeeApi.Models;

public class MoodCheckin
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public int Rating { get; set; } // 1–5
    public string? Note { get; set; }
    public DateOnly Week { get; set; } // Monday of the week
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
