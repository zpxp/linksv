using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace provider.Migrations
{
    public partial class DestroyedLink : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDestroyed",
                table: "Origins",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDestroyed",
                table: "Origins");
        }
    }
}
