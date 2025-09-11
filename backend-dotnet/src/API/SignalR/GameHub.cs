using Microsoft.AspNetCore.SignalR;
using MediatR;
using Core.Interfaces;
using Core.Services;
using Core.Entities;

namespace API.SignalR;

public class GameHub : Hub
{
    private readonly IMediator _mediator;
    private readonly IGameRepository _gameRepository;
    private readonly IMatchRepository _matchRepository;
    private static readonly Dictionary<string, string> _userConnections = new();
    private static readonly List<string> _waitingPlayers = new();
    private static readonly BotPlayer _botPlayer = new();

    public GameHub(
        IMediator mediator, 
        IGameRepository gameRepository,
        IMatchRepository matchRepository)
    {
        _mediator = mediator;
        _gameRepository = gameRepository;
        _matchRepository = matchRepository;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = _userConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections.Remove(userId);
            _waitingPlayers.Remove(userId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task FindMatch(string userId, string mode = "online")
    {
        if (mode == "bot")
        {
            await StartBotGame(userId);
            return;
        }

        if (_waitingPlayers.Contains(userId))
            return;

        _waitingPlayers.Add(userId);
        await Clients.Caller.SendAsync("waitingForMatch");

        if (_waitingPlayers.Count >= 2)
        {
            var player1 = _waitingPlayers[0];
            var player2 = _waitingPlayers[1];
            _waitingPlayers.RemoveRange(0, 2);

            var game = Game.Create(player1, player2);
            await _gameRepository.AddAsync(game);

            var player1Connection = _userConnections.GetValueOrDefault(player1);
            var player2Connection = _userConnections.GetValueOrDefault(player2);

            if (!string.IsNullOrEmpty(player1Connection) && !string.IsNullOrEmpty(player2Connection))
            {
                await Groups.AddToGroupAsync(player1Connection, $"game_{game.Id}");
                await Groups.AddToGroupAsync(player2Connection, $"game_{game.Id}");

                await Clients.Client(player1Connection).SendAsync("matchFound", new { gameId = game.Id, isPlayer1 = true, opponentId = player2 });
                await Clients.Client(player2Connection).SendAsync("matchFound", new { gameId = game.Id, isPlayer1 = false, opponentId = player1 });

                // 2 saniye sonra oyunu başlat
                await Task.Delay(2000);
                game.StartGame();
                await _gameRepository.UpdateAsync(game);

                await SendGameState(game);
            }
        }
    }

    private async Task StartBotGame(string userId)
    {
        var game = Game.Create(userId, "bot");
        await _gameRepository.AddAsync(game);

        var userConnection = _userConnections.GetValueOrDefault(userId);
        if (!string.IsNullOrEmpty(userConnection))
        {
            await Groups.AddToGroupAsync(userConnection, $"game_{game.Id}");
            await Clients.Client(userConnection).SendAsync("matchFound", new { gameId = game.Id, isPlayer1 = true, opponentId = "bot" });

            await Task.Delay(2000);
            game.StartGame();
            await _gameRepository.UpdateAsync(game);

            await SendGameState(game);
        }
    }

    public async Task PlayCard(string gameId, string userId, int cardNumber)
    {
        var game = await _gameRepository.GetByIdAsync(gameId);
        if (game == null)
        {
            await Clients.Caller.SendAsync("error", "Oyun bulunamadı");
            return;
        }

        try
        {
            game.PlayCard(userId, cardNumber);

            // Bot modu kontrolü
            if (game.Player2Id == "bot" && game.Player1Card.HasValue && !game.Player2Card.HasValue)
            {
                var botValidCards = game.GetValidCards("bot");
                var botCard = _botPlayer.SelectCard(botValidCards, game);
                game.PlayCard("bot", botCard);
            }

            await _gameRepository.UpdateAsync(game);

            await Clients.Caller.SendAsync("cardPlayed", new { cardNumber });
            await Clients.GroupExcept($"game_{gameId}", Context.ConnectionId).SendAsync("opponentPlayed");

            if (game.Player1Card.HasValue && game.Player2Card.HasValue)
            {
                await SendGameState(game);

                if (game.Status == GameStatus.Completed)
                {
                    // Maç sonucunu kaydet
                    var match = Match.Create(
                        game.Player1Id,
                        game.Player2Id,
                        game.Player1Score,
                        game.Player2Score,
                        game.Player2Id == "bot" ? GameMode.Bot : GameMode.Online
                    );
                    await _matchRepository.AddAsync(match);

                    await SendGameResult(game);
                }
            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("error", ex.Message);
        }
    }

    private async Task SendGameState(Game game)
    {
        var player1Connection = _userConnections.GetValueOrDefault(game.Player1Id);
        var player2Connection = game.Player2Id != "bot" ? _userConnections.GetValueOrDefault(game.Player2Id) : null;

        if (!string.IsNullOrEmpty(player1Connection))
        {
            var player1State = new
            {
                gameId = game.Id,
                currentRound = game.CurrentRound,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score,
                validCards = game.GetValidCards(game.Player1Id),
                forbiddenCards = game.Player1ForbiddenCards,
                roundStartTime = game.RoundStartTime
            };
            await Clients.Client(player1Connection).SendAsync("gameState", player1State);
        }

        if (!string.IsNullOrEmpty(player2Connection))
        {
            var player2State = new
            {
                gameId = game.Id,
                currentRound = game.CurrentRound,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score,
                validCards = game.GetValidCards(game.Player2Id),
                forbiddenCards = game.Player2ForbiddenCards,
                roundStartTime = game.RoundStartTime
            };
            await Clients.Client(player2Connection).SendAsync("gameState", player2State);
        }
    }

    private async Task SendGameResult(Game game)
    {
        var result = new
        {
            gameId = game.Id,
            player1Score = game.Player1Score,
            player2Score = game.Player2Score,
            winnerId = game.WinnerId,
            totalRounds = 7
        };

        await Clients.Group($"game_{game.Id}").SendAsync("gameEnded", result);
    }
}