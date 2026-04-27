namespace EmployeeApi.Models;
public class PayrollItem {
    public int Id { get; set; }
    public int PayrollId { get; set; }
    public string Type { get; set; } = "Allowance";  // Allowance | Deduction
    public string Label { get; set; } = "";
    public decimal Amount { get; set; }
}
