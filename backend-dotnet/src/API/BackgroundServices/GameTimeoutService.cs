using Microsoft.AspNetCore.SignalR;
using Core.Interfaces;
using Core.Entities;
using API.SignalR;

namespace API.BackgroundServices;

public class GameTimeoutService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<GameTimeoutService> _logger;
    private const int ROUND_DURATION_SECONDS = 30;

    public GameTimeoutService(
        IServiceProvider serviceProvider,
        ILogger<GameTimeoutService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var gameRepository = scope.ServiceProvider.GetRequiredService<IGameRepository>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<GameHub>>();

                try
                {
                    var activeGames = await gameRepository.GetActiveGamesAsync();
                    foreach (var game in activeGames)
                    {
                        if (game.RoundStartTime.HasValue)
                        {
                            var elapsedSeconds = (DateTime.UtcNow - game.RoundStartTime.Value).TotalSeconds;

                            // Çok eski terk edilmiş oyunları kapat (5 dakikadan eski)
                            if (elapsedSeconds >= 300)
                            {
                                _logger.LogWarning($"🗑️ Terk edilmiş oyun kapatılıyor: GameId={game.Id}");
                                var winner = game.Player1Score > game.Player2Score ? game.Player1Id :
                                           game.Player2Score > game.Player1Score ? game.Player2Id :
                                           game.Player1Id; // Berabere ise Player1 kazansın
                                game.EndGameWithWinner(winner);
                                await gameRepository.UpdateAsync(game);
                                continue;
                            }

                            // SADECE timeout olduğunda işlem yap ve event gönder
                            if (elapsedSeconds >= ROUND_DURATION_SECONDS)
                            {
                                _logger.LogInformation($"⏰ Timeout: GameId={game.Id}, Round={game.CurrentRound}");

                                // Round süresi doldu, otomatik hamle yap
                                game.HandleTimeout();
                                await gameRepository.UpdateAsync(game);

                                // Oyun durumunu güncelle - SADECE timeout olduğunda
                                await SendGameState(hubContext, game);

                                // Oyun bittiyse sonucu gönder
                                if (game.Status == GameStatus.Completed)
                                {
                                    await SendGameResult(hubContext, game);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Oyun timeout kontrolü sırasında hata oluştu");
                }
            }

            await Task.Delay(1000, stoppingToken); // Her saniye kontrol et
        }
    }

    private static async Task SendGameState(IHubContext<GameHub> hubContext, Game game)
    {
        // Her oyuncu için ayrı state hazırla
        var player1State = new
        {
            gameId = game.Id,
            currentRound = game.CurrentRound,
            player1Score = game.Player1Score,
            player2Score = game.Player2Score,
            validCards = game.GetValidCards(game.Player1Id),
            forbiddenCards = game.Player1ForbiddenCards,
            roundStartTime = game.RoundStartTime,
            status = game.Status.ToString(),
            opponentId = game.Player2Id
        };

        var player2State = new
        {
            gameId = game.Id,
            currentRound = game.CurrentRound,
            player1Score = game.Player1Score,
            player2Score = game.Player2Score,
            validCards = game.GetValidCards(game.Player2Id),
            forbiddenCards = game.Player2ForbiddenCards,
            roundStartTime = game.RoundStartTime,
            status = game.Status.ToString(),
            opponentId = game.Player1Id
        };

        // Her oyuncuya kendi state'ini gönder
        await hubContext.Clients.Group($"game_{game.Id}_player_{game.Player1Id}").SendAsync("gameState", player1State);
        if (game.Player2Id != "bot")
        {
            await hubContext.Clients.Group($"game_{game.Id}_player_{game.Player2Id}").SendAsync("gameState", player2State);
        }
    }

    private static async Task SendGameResult(IHubContext<GameHub> hubContext, Game game)
    {
        var result = new
        {
            gameId = game.Id,
            player1Score = game.Player1Score,
            player2Score = game.Player2Score,
            winnerId = game.WinnerId,
            totalRounds = 7
        };

        await hubContext.Clients.Group($"game_{game.Id}").SendAsync("gameEnded", result);
    }
}
