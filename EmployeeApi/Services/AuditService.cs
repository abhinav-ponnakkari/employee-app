using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Services;

public class AuditService {
    private readonly AppDbContext _db;
    public AuditService(AppDbContext db) => _db = db;

    public async Task LogAsync(string action, string entityType, int? entityId, string username, string? details = null) {
        try {
            _db.AuditLogs.Add(new AuditLog {
                Timestamp = DateTime.UtcNow,
                Username = username,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
            });
            await _db.SaveChangesAsync();
        } catch { /* audit failures must not break main flow */ }
    }
}
