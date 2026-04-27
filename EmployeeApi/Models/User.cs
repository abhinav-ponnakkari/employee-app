namespace EmployeeApi.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Employee"; // Admin | HR | Employee
    public string DisplayName { get; set; } = string.Empty;
    public int? EmployeeId { get; set; } // links User to an Employee record (Employee role)
}
