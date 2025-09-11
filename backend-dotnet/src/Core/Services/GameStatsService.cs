using Core.Interfaces;
using Core.Entities;

namespace Core.Services;

public class GameStatsService
{
    private readonly IGameRepository _gameRepository;
    private readonly IMatchRepository _matchRepository;

    public GameStatsService(IGameRepository gameRepository, IMatchRepository matchRepository)
    {
        _gameRepository = gameRepository;
        _matchRepository = matchRepository;
    }

    public async Task<GameStats> GetGameStats()
    {
        var activeGames = await _gameRepository.GetActiveGamesAsync();
        var matches = await _matchRepository.GetAllMatchesAsync();

        return new GameStats
        {
            ActiveGames = activeGames.Count(),
            TotalGamesPlayed = matches.Count(),
            OnlineGames = matches.Count(m => m.Mode == GameMode.Online),
            BotGames = matches.Count(m => m.Mode == GameMode.Bot),
            AverageScore = matches.Any() ? 
                matches.Average(m => (m.Player1Score + m.Player2Score) / 2.0) : 0
        };
    }

    public async Task<UserStats> GetUserStats(string userId)
    {
        var matches = await _matchRepository.GetUserMatchesAsync(userId);
        var totalMatches = matches.Count();

        if (totalMatches == 0)
        {
            return new UserStats
            {
                UserId = userId,
                TotalGames = 0,
                WonGames = 0,
                LostGames = 0,
                DrawGames = 0,
                WinRate = 0,
                AverageScore = 0,
                OnlineGames = 0,
                BotGames = 0
            };
        }

        var wonGames = matches.Count(m => m.WinnerId == userId);
        var lostGames = matches.Count(m => m.WinnerId != null && m.WinnerId != userId);
        var drawGames = matches.Count(m => m.WinnerId == null);

        var userScores = matches.Select(m => 
            m.Player1Id == userId ? m.Player1Score : m.Player2Score);

        return new UserStats
        {
            UserId = userId,
            TotalGames = totalMatches,
            WonGames = wonGames,
            LostGames = lostGames,
            DrawGames = drawGames,
            WinRate = (double)wonGames / totalMatches * 100,
            AverageScore = userScores.Average(),
            OnlineGames = matches.Count(m => m.Mode == GameMode.Online),
            BotGames = matches.Count(m => m.Mode == GameMode.Bot)
        };
    }
}

public class GameStats
{
    public int ActiveGames { get; set; }
    public int TotalGamesPlayed { get; set; }
    public int OnlineGames { get; set; }
    public int BotGames { get; set; }
    public double AverageScore { get; set; }
}

public class UserStats
{
    public string UserId { get; set; }
    public int TotalGames { get; set; }
    public int WonGames { get; set; }
    public int LostGames { get; set; }
    public int DrawGames { get; set; }
    public double WinRate { get; set; }
    public double AverageScore { get; set; }
    public int OnlineGames { get; set; }
    public int BotGames { get; set; }
}
