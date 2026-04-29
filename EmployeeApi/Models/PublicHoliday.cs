namespace EmployeeApi.Models;

public class PublicHoliday
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public DateOnly Date { get; set; }
    public bool IsRecurring { get; set; } = true;
}
