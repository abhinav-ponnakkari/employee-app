using Microsoft.EntityFrameworkCore;
using EmployeeApi.Models;

namespace EmployeeApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<SalaryHistory> SalaryHistory => Set<SalaryHistory>();
    public DbSet<EmployeeNote> EmployeeNotes => Set<EmployeeNote>();
    public DbSet<User> Users => Set<User>();
    public DbSet<PunchRecord> PunchRecords => Set<PunchRecord>();
    public DbSet<Circular> Circulars => Set<Circular>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<PayrollItem> PayrollItems => Set<PayrollItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
}
