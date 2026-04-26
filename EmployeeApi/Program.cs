using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors();
app.MapControllers();
app.Run();
