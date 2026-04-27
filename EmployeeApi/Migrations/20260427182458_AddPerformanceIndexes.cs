using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PayrollItems_PayrollId",
                table: "PayrollItems",
                column: "PayrollId");

            migrationBuilder.AddForeignKey(
                name: "FK_PayrollItems_Payrolls_PayrollId",
                table: "PayrollItems",
                column: "PayrollId",
                principalTable: "Payrolls",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Employees: filter/sort columns
            migrationBuilder.CreateIndex("IX_Employees_Department", "Employees", "Department");
            migrationBuilder.CreateIndex("IX_Employees_Status", "Employees", "Status");

            // LeaveRequests: most queries filter by EmployeeId or Status
            migrationBuilder.CreateIndex("IX_LeaveRequests_EmployeeId", "LeaveRequests", "EmployeeId");
            migrationBuilder.CreateIndex("IX_LeaveRequests_Status", "LeaveRequests", "Status");

            // AuditLogs: ordered by Timestamp, filtered by Username
            migrationBuilder.CreateIndex("IX_AuditLogs_Timestamp", "AuditLogs", "Timestamp");
            migrationBuilder.CreateIndex("IX_AuditLogs_Username", "AuditLogs", "Username");

            // PunchRecords & Payrolls: always queried by EmployeeId
            migrationBuilder.CreateIndex("IX_PunchRecords_EmployeeId", "PunchRecords", "EmployeeId");
            migrationBuilder.CreateIndex("IX_Payrolls_EmployeeId", "Payrolls", "EmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey("FK_PayrollItems_Payrolls_PayrollId", "PayrollItems");
            migrationBuilder.DropIndex("IX_PayrollItems_PayrollId", "PayrollItems");
            migrationBuilder.DropIndex("IX_Employees_Department", "Employees");
            migrationBuilder.DropIndex("IX_Employees_Status", "Employees");
            migrationBuilder.DropIndex("IX_LeaveRequests_EmployeeId", "LeaveRequests");
            migrationBuilder.DropIndex("IX_LeaveRequests_Status", "LeaveRequests");
            migrationBuilder.DropIndex("IX_AuditLogs_Timestamp", "AuditLogs");
            migrationBuilder.DropIndex("IX_AuditLogs_Username", "AuditLogs");
            migrationBuilder.DropIndex("IX_PunchRecords_EmployeeId", "PunchRecords");
            migrationBuilder.DropIndex("IX_Payrolls_EmployeeId", "Payrolls");
        }
    }
}
