using Core.Entities;

namespace Core.Interfaces;

public interface IMatchRepository
{
    Task<Match?> GetByIdAsync(string id);
    Task<IEnumerable<Match>> GetUserMatchesAsync(string userId);
    Task<IEnumerable<Match>> GetAllMatchesAsync();
    Task<Match> AddAsync(Match match);
}