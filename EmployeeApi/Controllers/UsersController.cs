using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;
using EmployeeApi.Services;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public UsersController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Users
            .Select(u => new { u.Id, u.Username, u.Role, u.DisplayName, u.EmployeeId })
            .ToListAsync());

    [HttpGet("byemployee/{employeeId}")]
    public async Task<IActionResult> GetByEmployee(int employeeId)
    {
        var u = await _db.Users
            .Where(u => u.EmployeeId == employeeId)
            .Select(u => new { u.Id, u.Username, u.Role, u.DisplayName, u.EmployeeId })
            .FirstOrDefaultAsync();
        return u is null ? NotFound() : Ok(u);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest(new { message = "Username already taken." });

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            DisplayName = dto.DisplayName,
            EmployeeId = dto.EmployeeId,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Created", "User", user.Id, username, $"{user.Username} ({user.Role})");

        return Ok(new { user.Id, user.Username, user.Role, user.DisplayName, user.EmployeeId });
    }

    [HttpPatch("{id}/password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("PasswordReset", "User", id, username, null);

        return NoContent();
    }

    [HttpPatch("{id}/username")]
    public async Task<IActionResult> ChangeUsername(int id, [FromBody] ChangeUsernameDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username && u.Id != id))
            return BadRequest(new { message = "Username already taken." });
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.Username = dto.Username;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var me = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        if (id == me) return BadRequest(new { message = "Cannot delete your own account." });
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("Deleted", "User", id, username, $"ID {id}");

        return NoContent();
    }
}

public record CreateUserDto(string Username, string Password, string Role, string DisplayName, int? EmployeeId);
public record ResetPasswordDto(string Password);
public record ChangeUsernameDto(string Username);
