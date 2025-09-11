using Core.Entities;

namespace Core.Interfaces;

public interface IGameRepository
{
    Task<Game?> GetByIdAsync(string id);
    Task<IEnumerable<Game>> GetUserGamesAsync(string userId);
    Task<IEnumerable<Game>> GetActiveGamesAsync();
    Task<Game> AddAsync(Game game);
    Task UpdateAsync(Game game);
}
