using Microsoft.EntityFrameworkCore;
using Core.Entities;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<Match> Matches { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasMany(e => e.Moves)
                .WithOne()
                .HasForeignKey("GameId");

            entity.Property(e => e.Status)
                .HasConversion<string>();

            entity.Property(e => e.Player1UsedCards)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList());

            entity.Property(e => e.Player2UsedCards)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList());

            entity.Property(e => e.Player1ForbiddenCards)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList());

            entity.Property(e => e.Player2ForbiddenCards)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList());
        });

        modelBuilder.Entity<Match>(entity =>
        {
            entity.Property(e => e.Mode)
                .HasConversion<string>();
        });
    }
}