namespace EmployeeApi.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer"; // Admin | HR | Viewer
    public string DisplayName { get; set; } = string.Empty;
}
