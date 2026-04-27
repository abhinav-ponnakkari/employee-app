namespace EmployeeApi.Models;

public class PunchRecord
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public DateTime PunchIn { get; set; }
    public DateTime? PunchOut { get; set; }
    public string? Notes { get; set; }
}
