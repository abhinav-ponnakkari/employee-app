namespace EmployeeApi.Models;

public class EmployeeNote
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string NoteType { get; set; } = "General";
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
