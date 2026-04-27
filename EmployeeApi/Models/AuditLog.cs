namespace EmployeeApi.Models;
public class AuditLog {
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string Username { get; set; } = "";
    public string Action { get; set; } = "";      // Created, Updated, Deleted, Approved, Rejected, Finalized, Login
    public string EntityType { get; set; } = "";  // Employee, Leave, Payroll, User, System
    public int? EntityId { get; set; }
    public string? Details { get; set; }
}
