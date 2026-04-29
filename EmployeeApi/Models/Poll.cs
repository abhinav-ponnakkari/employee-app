namespace EmployeeApi.Models;

public class Poll
{
    public int Id { get; set; }
    public string Question { get; set; } = "";
    public string OptionsJson { get; set; } = "[]"; // JSON array of strings
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public List<PollVote> Votes { get; set; } = [];
}

public class PollVote
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public int EmployeeId { get; set; }
    public int OptionIndex { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
