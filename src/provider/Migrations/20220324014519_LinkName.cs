using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace provider.Migrations
{
    public partial class LinkName : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkLocationLinkOwner_LinkOwner_OwnersOwnerAddress",
                table: "LinkLocationLinkOwner");

            migrationBuilder.DropIndex(
                name: "IX_Locations_Nonce",
                table: "Locations");

            migrationBuilder.DropIndex(
                name: "IX_Locations_Origin",
                table: "Locations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LinkOwner",
                table: "LinkOwner");

            migrationBuilder.RenameTable(
                name: "LinkOwner",
                newName: "Owners");

            migrationBuilder.AddColumn<string>(
                name: "LinkName",
                table: "Locations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Owners",
                table: "Owners",
                column: "OwnerAddress");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Origin_Nonce",
                table: "Locations",
                columns: new[] { "Origin", "Nonce" });

            migrationBuilder.AddForeignKey(
                name: "FK_LinkLocationLinkOwner_Owners_OwnersOwnerAddress",
                table: "LinkLocationLinkOwner",
                column: "OwnersOwnerAddress",
                principalTable: "Owners",
                principalColumn: "OwnerAddress",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkLocationLinkOwner_Owners_OwnersOwnerAddress",
                table: "LinkLocationLinkOwner");

            migrationBuilder.DropIndex(
                name: "IX_Locations_Origin_Nonce",
                table: "Locations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Owners",
                table: "Owners");

            migrationBuilder.DropColumn(
                name: "LinkName",
                table: "Locations");

            migrationBuilder.RenameTable(
                name: "Owners",
                newName: "LinkOwner");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LinkOwner",
                table: "LinkOwner",
                column: "OwnerAddress");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Nonce",
                table: "Locations",
                column: "Nonce");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Origin",
                table: "Locations",
                column: "Origin");

            migrationBuilder.AddForeignKey(
                name: "FK_LinkLocationLinkOwner_LinkOwner_OwnersOwnerAddress",
                table: "LinkLocationLinkOwner",
                column: "OwnersOwnerAddress",
                principalTable: "LinkOwner",
                principalColumn: "OwnerAddress",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
