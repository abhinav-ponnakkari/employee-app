namespace EmployeeApi.Models;

public class AnonymousFeedback
{
    public int Id { get; set; }
    public string Content { get; set; } = "";
    public string Category { get; set; } = "General"; // General | Suggestion | Concern | Appreciation
    public bool IsRead { get; set; } = false;
    public string? HrReply { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RepliedAt { get; set; }
}
