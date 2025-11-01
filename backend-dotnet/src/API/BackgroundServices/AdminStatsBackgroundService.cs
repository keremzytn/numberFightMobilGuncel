using Microsoft.AspNetCore.SignalR;
using Core.Interfaces;
using API.SignalR;

namespace API.BackgroundServices;

public class AdminStatsBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AdminStatsBackgroundService> _logger;

    public AdminStatsBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<AdminStatsBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Admin Stats Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<AdminHub>>();
                var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var gameRepository = scope.ServiceProvider.GetRequiredService<IGameRepository>();

                var allUsers = await userRepository.GetAllAsync();
                var activeGames = await gameRepository.GetActiveGamesAsync();
                var allGames = await gameRepository.GetAllGamesAsync();

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

                // Tüm bağlı admin'lere gönder
                await hubContext.Clients.All.SendAsync("ReceiveStats", stats, stoppingToken);

                _logger.LogInformation("Stats sent to all connected admins at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Admin Stats Background Service");
            }

            // 5 saniyede bir güncelle
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}

