using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeApi.Migrations
{
    public partial class FixManagerIdColumn : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Safely add ManagerId column if it doesn't already exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'Employees' AND column_name = 'ManagerId'
                    ) THEN
                        ALTER TABLE ""Employees"" ADD COLUMN ""ManagerId"" integer NULL;
                    END IF;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Employees"" DROP COLUMN IF EXISTS ""ManagerId"";
            ");
        }
    }
}
