using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using EmployeeApi.Data;
using EmployeeApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var rawUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

string connectionString;
if (rawUrl != null && (rawUrl.StartsWith("postgres://") || rawUrl.StartsWith("postgresql://")))
{
    var uri = new Uri(rawUrl);
    var userInfo = uri.UserInfo.Split(':', 2);
    var host = uri.Host;
    var port = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = Uri.UnescapeDataString(userInfo[1]);
    var sslMode = host.Contains(".internal") ? "Disable" : "Require";
    connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode={sslMode};Trust Server Certificate=true";
}
else
{
    connectionString = rawUrl!;
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// JWT auth
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

// Run migrations and seed default users
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var retries = 5;
    while (retries > 0)
    {
        try
        {
            db.Database.Migrate();
            break;
        }
        catch (Exception ex)
        {
            retries--;
            Console.WriteLine($"Migration failed, {retries} retries left: {ex.Message}");
            if (retries == 0) throw;
            Thread.Sleep(3000);
        }
    }

    if (!db.Users.Any())
    {
        // Seed demo employee records
        int? emp1Id = null, emp2Id = null, emp3Id = null;
        if (!db.Employees.Any())
        {
            var demoEmps = new[]
            {
                new Employee { FirstName = "Alice", LastName = "Johnson", Email = "alice@company.com", Department = "Engineering", Position = "Software Engineer",  Salary = 85000, HireDate = new DateOnly(2022, 3, 15), Status = "Active" },
                new Employee { FirstName = "Bob",   LastName = "Smith",   Email = "bob@company.com",   Department = "Marketing",   Position = "Marketing Manager",  Salary = 75000, HireDate = new DateOnly(2021, 6, 1),  Status = "Active" },
                new Employee { FirstName = "Carol", LastName = "White",   Email = "carol@company.com", Department = "Finance",     Position = "Financial Analyst",  Salary = 70000, HireDate = new DateOnly(2023, 1, 10), Status = "Active" },
            };
            db.Employees.AddRange(demoEmps);
            db.SaveChanges();
            emp1Id = demoEmps[0].Id;
            emp2Id = demoEmps[1].Id;
            emp3Id = demoEmps[2].Id;
        }
        else
        {
            var ids = db.Employees.Take(3).Select(e => e.Id).ToList();
            if (ids.Count > 0) emp1Id = ids[0];
            if (ids.Count > 1) emp2Id = ids[1];
            if (ids.Count > 2) emp3Id = ids[2];
        }

        db.Users.AddRange(
            new User { Username = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), Role = "Admin",    DisplayName = "Administrator" },
            new User { Username = "hr",    PasswordHash = BCrypt.Net.BCrypt.HashPassword("hr123"),    Role = "HR",       DisplayName = "HR Manager" },
            new User { Username = "alice", PasswordHash = BCrypt.Net.BCrypt.HashPassword("alice123"), Role = "Employee", DisplayName = "Alice Johnson", EmployeeId = emp1Id },
            new User { Username = "bob",   PasswordHash = BCrypt.Net.BCrypt.HashPassword("bob123"),   Role = "Employee", DisplayName = "Bob Smith",     EmployeeId = emp2Id },
            new User { Username = "carol", PasswordHash = BCrypt.Net.BCrypt.HashPassword("carol123"), Role = "Employee", DisplayName = "Carol White",   EmployeeId = emp3Id }
        );
        db.SaveChanges();
        Console.WriteLine("Default users and demo employees seeded.");
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
