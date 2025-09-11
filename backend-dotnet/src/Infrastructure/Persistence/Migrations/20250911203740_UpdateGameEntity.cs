using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGameEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentRound",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Player1Card",
                table: "Games",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Player1ForbiddenCards",
                table: "Games",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Player1UsedCards",
                table: "Games",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Player2Card",
                table: "Games",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Player2ForbiddenCards",
                table: "Games",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Player2UsedCards",
                table: "Games",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RoundStartTime",
                table: "Games",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "GameMove",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentRound",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player1Card",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player1ForbiddenCards",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player1UsedCards",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player2Card",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player2ForbiddenCards",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player2UsedCards",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "RoundStartTime",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "GameMove");
        }
    }
}
