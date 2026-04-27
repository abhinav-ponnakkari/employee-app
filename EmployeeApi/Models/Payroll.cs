namespace EmployeeApi.Models;
public class Payroll {
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public int Month { get; set; }   // 1–12
    public int Year { get; set; }
    public decimal BaseSalary { get; set; }
    public decimal NetPay { get; set; }   // BaseSalary + allowances - deductions
    public string Status { get; set; } = "Draft";  // Draft | Finalized
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public List<PayrollItem> Items { get; set; } = new();
}
