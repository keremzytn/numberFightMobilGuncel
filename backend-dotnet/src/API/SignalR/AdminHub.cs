using Microsoft.AspNetCore.SignalR;
using Core.Interfaces;

namespace API.SignalR;

public class AdminHub : Hub
{
    private readonly IUserRepository _userRepository;
    private readonly IGameRepository _gameRepository;
    private readonly ILogger<AdminHub> _logger;
    private readonly IHubContext<AdminHub> _hubContext;

    public AdminHub(
        IUserRepository userRepository,
        IGameRepository gameRepository,
        ILogger<AdminHub> logger,
        IHubContext<AdminHub> hubContext)
    {
        _userRepository = userRepository;
        _gameRepository = gameRepository;
        _logger = logger;
        _hubContext = hubContext;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Admin connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();

        // Buffer'daki tüm logları bu connection'a gönder
        try
        {
            await API.Services.AdminLoggerProvider.SendBufferedLogs(_hubContext, Context.ConnectionId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"Buffer logları gönderilirken hata: {ex.Message}");
        }

        // İlk bağlantıda güncel istatistikleri gönder
        await SendStats();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Admin disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendStats()
    {
        try
        {
            var allUsers = await _userRepository.GetAllAsync();
            var activeGames = await _gameRepository.GetActiveGamesAsync();
            var allGames = await _gameRepository.GetAllGamesAsync();

            var usersList = allUsers.ToList();
            var gamesList = allGames.ToList();

            // Son 7 günün oyun istatistikleri
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.UtcNow.AddDays(-i).Date)
                .Reverse()
                .ToList();

            var gamesPerDay = last7Days.Select(date => new
            {
                Date = date,
                Count = gamesList.Count(g => g.CreatedAt.Date == date)
            }).ToList();

            var stats = new
            {
                TotalUsers = usersList.Count,
                ActiveGames = activeGames.Count(),
                CompletedGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Completed),
                TotalGames = gamesList.Count,
                OnlineUsers = usersList.Count(u => u.IsOnline),
                OfflineUsers = usersList.Count(u => !u.IsOnline),
                BannedUsers = usersList.Count(u => u.IsBanned),

                // Grafik verileri
                Last7DaysLabels = last7Days.Select(d => d.ToString("dd MMM")).ToList(),
                Last7DaysGameCounts = gamesPerDay.Select(g => g.Count).ToList(),

                // Oyun durum dağılımı
                WaitingGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Waiting),
                InProgressGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.InProgress),
                CompletedGamesCount = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Completed),
                CancelledGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Cancelled),

                // Timestamp
                UpdatedAt = DateTime.UtcNow
            };

            await Clients.Caller.SendAsync("ReceiveStats", stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending stats to admin");
        }
    }

    public async Task RequestStatsUpdate()
    {
        await SendStats();
    }

    // Tüm admin clientlara log gönder
    public static async Task BroadcastLog(IHubContext<AdminHub> hubContext, string message, string level = "Info", object? details = null)
    {
        try
        {
            await hubContext.Clients.All.SendAsync("ReceiveLog", new
            {
                message = message,
                level = level,
                details = details,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception)
        {
            // Log gönderme hatası - sessizce yok say
        }
    }
}

