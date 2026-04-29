namespace EmployeeApi.Models;

public class LeavePolicy
{
    public int Id { get; set; }
    public string LeaveType { get; set; } = "";
    public int EntitlementDays { get; set; }
    public string? Description { get; set; }
}
