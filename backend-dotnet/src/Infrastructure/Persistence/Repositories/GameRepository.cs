using Microsoft.EntityFrameworkCore;
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Persistence.Repositories;

public class GameRepository : IGameRepository
{
    private readonly AppDbContext _context;

    public GameRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Game?> GetByIdAsync(string id)
    {
        return await _context.Games
            .Include(g => g.Moves)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<IEnumerable<Game>> GetUserGamesAsync(string userId)
    {
        return await _context.Games
            .Include(g => g.Moves)
            .Where(g => g.Player1Id == userId || g.Player2Id == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Game>> GetActiveGamesAsync()
    {
        return await _context.Games
            .Include(g => g.Moves)
            .Where(g => g.Status == GameStatus.InProgress)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Game>> GetAllGamesAsync()
    {
        return await _context.Games
            .Include(g => g.Moves)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<Game> AddAsync(Game game)
    {
        await _context.Games.AddAsync(game);
        await _context.SaveChangesAsync();
        return game;
    }

    public async Task UpdateAsync(Game game)
    {
        _context.Entry(game).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }
}
