using Microsoft.AspNetCore.SignalR;
using MediatR;
using Core.Interfaces;
using Core.Services;
using Core.Entities;
using System.Security.Claims;

namespace API.SignalR;

public class GameHub : Hub
{
    private readonly IMediator _mediator;
    private readonly IGameRepository _gameRepository;
    private readonly IMatchRepository _matchRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFriendRepository _friendRepository;
    private readonly IHubContext<AdminHub> _adminHubContext;
    private static readonly Dictionary<string, string> _userConnections = new();
    private static readonly List<string> _waitingPlayers = new();
    private static readonly Dictionary<string, List<string>> _friendInvitations = new();
    private static readonly BotPlayer _botPlayer = new();

    public GameHub(
        IMediator mediator,
        IGameRepository gameRepository,
        IMatchRepository matchRepository,
        IUserRepository userRepository,
        IFriendRepository friendRepository,
        IHubContext<AdminHub> adminHubContext)
    {
        _mediator = mediator;
        _gameRepository = gameRepository;
        _matchRepository = matchRepository;
        _userRepository = userRepository;
        _friendRepository = friendRepository;
        _adminHubContext = adminHubContext;
    }

    private async Task LogToAdmin(string message, string level = "Info", object? details = null)
    {
        Console.WriteLine($"[{level}] {message}");
        await AdminHub.BroadcastLog(_adminHubContext, message, level, details);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            // Update user online status
            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                user.SetOnlineStatus(true);
                await _userRepository.UpdateAsync(user);

                // Notify friends that user is online
                await NotifyFriendsOnlineStatus(userId, true);
            }
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

            // Update user offline status
            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                user.SetOnlineStatus(false);
                await _userRepository.UpdateAsync(user);

                // Notify friends that user is offline
                await NotifyFriendsOnlineStatus(userId, false);
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task FindMatch(string userId, string mode = "online")
    {
        // Kullanıcının eski oyun gruplarından çıkar
        await RemoveUserFromAllGameGroups(userId);

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
            
            await LogToAdmin($"🎮 Match bulundu! P1: {player1.Substring(0, 8)}, P2: {player2.Substring(0, 8)}", "Info");

            var game = Game.Create(player1, player2, GameMode.Online);
            
            // Gold kontrolü ve çekme
            var player1User = await _userRepository.GetByIdAsync(player1);
            var player2User = await _userRepository.GetByIdAsync(player2);
            
            if (player1User == null || player2User == null)
            {
                await Clients.Caller.SendAsync("error", "Oyuncu bulunamadı");
                return;
            }
            
            try
            {
                player1User.RemoveGold(game.EntryFee);
                player2User.RemoveGold(game.EntryFee);
                game.MarkPlayerPaid(player1);
                game.MarkPlayerPaid(player2);
                
                await _userRepository.UpdateAsync(player1User);
                await _userRepository.UpdateAsync(player2User);
            }
            catch (InvalidOperationException)
            {
                await Clients.Caller.SendAsync("error", "Yetersiz gold miktarı");
                return;
            }
            
            await _gameRepository.AddAsync(game);

            var player1Connection = _userConnections.GetValueOrDefault(player1);
            var player2Connection = _userConnections.GetValueOrDefault(player2);

            if (!string.IsNullOrEmpty(player1Connection) && !string.IsNullOrEmpty(player2Connection))
            {
                // Her oyuncu için ayrı grup - her oyuncuya farklı state göndermek için
                await Groups.AddToGroupAsync(player1Connection, $"game_{game.Id}");
                await Groups.AddToGroupAsync(player2Connection, $"game_{game.Id}");
                await Groups.AddToGroupAsync(player1Connection, $"game_{game.Id}_player_{player1}");
                await Groups.AddToGroupAsync(player2Connection, $"game_{game.Id}_player_{player2}");

                await Clients.Client(player1Connection).SendAsync("matchFound", new { gameId = game.Id, isPlayer1 = true, opponentId = player2 });
                await Clients.Client(player2Connection).SendAsync("matchFound", new { gameId = game.Id, isPlayer1 = false, opponentId = player1 });

                // 2 saniye sonra oyunu başlat
                await Task.Delay(2000);
                game.StartGame();
                await _gameRepository.UpdateAsync(game);
                await LogToAdmin($"✅ Online oyun başladı - GameId: {game.Id.Substring(0, 8)}", "Info");

                await SendGameState(game);
            }
        }
    }

    private async Task StartBotGame(string userId)
    {
        var game = Game.Create(userId, "bot", GameMode.Bot);
        
        // Gold kontrolü ve çekme
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            await Clients.Caller.SendAsync("error", "Kullanıcı bulunamadı");
            return;
        }
        
        try
        {
            user.RemoveGold(game.EntryFee);
            game.MarkPlayerPaid(userId);
            game.MarkPlayerPaid("bot"); // Bot ücretsiz
            
            await _userRepository.UpdateAsync(user);
        }
        catch (InvalidOperationException)
        {
            await Clients.Caller.SendAsync("error", "Yetersiz gold miktarı");
            return;
        }
        
        await _gameRepository.AddAsync(game);

        var userConnection = _userConnections.GetValueOrDefault(userId);
        if (!string.IsNullOrEmpty(userConnection))
        {
            await Groups.AddToGroupAsync(userConnection, $"game_{game.Id}");
            await Groups.AddToGroupAsync(userConnection, $"game_{game.Id}_player_{userId}");
            await Clients.Client(userConnection).SendAsync("matchFound", new { gameId = game.Id, isPlayer1 = true, opponentId = "bot" });

            await Task.Delay(2000);
            game.StartGame();
            await _gameRepository.UpdateAsync(game);
            await LogToAdmin($"🤖 Bot oyunu başladı - GameId: {game.Id.Substring(0, 8)}, User: {userId.Substring(0, 8)}", "Info");

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
            await LogToAdmin($"PlayCard çağrıldı - GameId: {gameId.Substring(0, 8)}, UserId: {userId.Substring(0, 8)}, Card: {cardNumber}", "Debug");
            var previousRound = game.CurrentRound;

            game.PlayCard(userId, cardNumber);
            await LogToAdmin($"Kart oynadı - Player1Card: {game.Player1Card}, Player2Card: {game.Player2Card}", "Debug");

            // Oyunu kaydet (diğer oyuncu kart oynamadan önce)
            await _gameRepository.UpdateAsync(game);

            // Bot modu kontrolü
            if (game.Player2Id == "bot" && game.Player1Card.HasValue && !game.Player2Card.HasValue)
            {
                var botValidCards = game.GetValidCards("bot");
                var botCard = _botPlayer.SelectCard(botValidCards, game);
                game.PlayCard("bot", botCard);
            }

            // Kart oynadığını bildir
            await Clients.Caller.SendAsync("cardPlayed", new { cardNumber });
            await Clients.GroupExcept($"game_{gameId}", Context.ConnectionId).SendAsync("opponentPlayed");

            // Her iki oyuncu da kart oynadıysa round sonucunu gönder
            if (game.Player1Card.HasValue && game.Player2Card.HasValue)
            {
                await LogToAdmin($"Her iki oyuncu da kart oynadı - Round çözülüyor...", "Info");
                // Kartları kaydet (ResolveRound bunları null yapacak)
                var player1Card = game.Player1Card.Value;
                var player2Card = game.Player2Card.Value;

                // Round'u çöz
                game.ResolveRound();
                await _gameRepository.UpdateAsync(game);
                await LogToAdmin($"Round çözüldü - Score: {game.Player1Score}-{game.Player2Score}", "Info");

                // Round sonucunu hesapla ve gönder
                await SendRoundResult(game, previousRound, player1Card, player2Card);
                await LogToAdmin("Round sonucu gönderildi", "Info");

                if (game.Status == GameStatus.Completed)
                {
                    await SendGameResult(game);
                }
                else
                {
                    // Sonraki round için gameState gönder
                    await Task.Delay(2000);
                    await SendGameState(game);
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
                roundStartTime = game.RoundStartTime,
                status = game.Status.ToString(),
                opponentId = game.Player2Id
            };
            await Clients.Client(player1Connection).SendAsync("gameState", player1State);
        }

        if (!string.IsNullOrEmpty(player2Connection))
        {
            var player2State = new
            {
                gameId = game.Id,
                currentRound = game.CurrentRound,
                player1Score = game.Player1Score,  // Player2'ye de gerçek skorları gönder
                player2Score = game.Player2Score,
                validCards = game.GetValidCards(game.Player2Id),
                forbiddenCards = game.Player2ForbiddenCards,  // Player2'nin kendi yasaklı kartları
                roundStartTime = game.RoundStartTime,
                status = game.Status.ToString(),
                opponentId = game.Player1Id
            };
            await Clients.Client(player2Connection).SendAsync("gameState", player2State);
        }
    }

    private async Task SendRoundResult(Game game, int round, int player1Card, int player2Card)
    {
        var player1Connection = _userConnections.GetValueOrDefault(game.Player1Id);
        var player2Connection = game.Player2Id != "bot" ? _userConnections.GetValueOrDefault(game.Player2Id) : null;

        string? winnerId = null;
        if (player1Card > player2Card)
            winnerId = game.Player1Id;
        else if (player2Card > player1Card)
            winnerId = game.Player2Id;

        if (!string.IsNullOrEmpty(player1Connection))
        {
            var player1Result = new
            {
                round = round,
                player1Card = player1Card,
                player2Card = player2Card,
                opponentCard = player2Card,
                winner = winnerId,
                isWinner = winnerId == game.Player1Id,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score
            };
            await Clients.Client(player1Connection).SendAsync("roundResult", player1Result);
        }

        if (!string.IsNullOrEmpty(player2Connection))
        {
            var player2Result = new
            {
                round = round,
                player1Card = player2Card,
                player2Card = player1Card,
                opponentCard = player1Card,
                winner = winnerId,
                isWinner = winnerId == game.Player2Id,
                player1Score = game.Player2Score,
                player2Score = game.Player1Score
            };
            await Clients.Client(player2Connection).SendAsync("roundResult", player2Result);
        }
    }

    private async Task SendGameResult(Game game)
    {
        // Maç sonucunu kaydet
        var match = Match.Create(
            game.Player1Id,
            game.Player2Id,
            game.Player1Score,
            game.Player2Score,
            game.Mode
        );
        await _matchRepository.AddAsync(match);
        
        // Ödülleri dağıt
        await DistributeRewards(game);
        
        var player1Connection = _userConnections.GetValueOrDefault(game.Player1Id);
        var player2Connection = game.Player2Id != "bot" ? _userConnections.GetValueOrDefault(game.Player2Id) : null;

        await LogToAdmin($"🏁 Oyun bitti - P1: {game.Player1Score}, P2: {game.Player2Score}, Kazanan: {game.WinnerId}", "Info");
        await LogToAdmin($"P1 Connection: {player1Connection}, P2 Connection: {player2Connection}", "Debug");

        if (!string.IsNullOrEmpty(player1Connection))
        {
            var player1Result = new
            {
                gameId = game.Id,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score,
                winnerId = game.WinnerId,
                winner = game.WinnerId,
                isWinner = game.WinnerId == game.Player1Id,
                totalRounds = 7,
                currentUserId = game.Player1Id
            };
            await LogToAdmin($"Player1'e gameEnd gönderiliyor: isWinner={player1Result.isWinner}", "Info");
            await Clients.Client(player1Connection).SendAsync("gameEnd", player1Result);
        }

        if (!string.IsNullOrEmpty(player2Connection))
        {
            var player2Result = new
            {
                gameId = game.Id,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score,
                winnerId = game.WinnerId,
                winner = game.WinnerId,
                isWinner = game.WinnerId == game.Player2Id,
                totalRounds = 7,
                currentUserId = game.Player2Id
            };
            await LogToAdmin($"Player2'ye gameEnd gönderiliyor: isWinner={player2Result.isWinner}", "Info");
            await Clients.Client(player2Connection).SendAsync("gameEnd", player2Result);
        }
    }
    
    private async Task DistributeRewards(Game game)
    {
        var player1 = await _userRepository.GetByIdAsync(game.Player1Id);
        if (player1 == null)
            return;

        var player1Reward = game.CalculateReward(game.Player1Id);
        player1.AddGold(player1Reward);
        await _userRepository.UpdateAsync(player1);
        
        // Bot maçı değilse player2'ye de ödül ver
        if (game.Mode == GameMode.Online && game.Player2Id != "bot")
        {
            var player2 = await _userRepository.GetByIdAsync(game.Player2Id);
            if (player2 != null)
            {
                var player2Reward = game.CalculateReward(game.Player2Id);
                player2.AddGold(player2Reward);
                await _userRepository.UpdateAsync(player2);
            }
        }
    }

    private string GetCurrentUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.GetHttpContext()?.Request.Query["userId"].ToString()
            ?? throw new UnauthorizedAccessException("Kullanıcı kimliği bulunamadı");
    }

    private async Task NotifyFriendsOnlineStatus(string userId, bool isOnline)
    {
        var friends = await _friendRepository.GetUserFriendsAsync(userId, FriendshipStatus.Accepted);

        foreach (var friend in friends)
        {
            var friendUserId = friend.UserId == userId ? friend.FriendUserId : friend.UserId;
            var friendConnection = _userConnections.GetValueOrDefault(friendUserId);

            if (!string.IsNullOrEmpty(friendConnection))
            {
                await Clients.Client(friendConnection).SendAsync("friendOnlineStatusChanged", new
                {
                    friendId = userId,
                    isOnline = isOnline
                });
            }
        }
    }

    private async Task RemoveUserFromAllGameGroups(string userId)
    {
        try
        {
            // Kullanıcının aktif olmayan tüm oyunlarını bul
            var userGames = await _gameRepository.GetUserGamesAsync(userId);
            var connectionId = _userConnections.GetValueOrDefault(userId);

            if (string.IsNullOrEmpty(connectionId))
                return;

            foreach (var game in userGames)
            {
                // Sadece tamamlanmış veya bekleyen oyun gruplarından çıkar
                if (game.Status != GameStatus.InProgress)
                {
                    await Groups.RemoveFromGroupAsync(connectionId, $"game_{game.Id}");
                    await Groups.RemoveFromGroupAsync(connectionId, $"game_{game.Id}_player_{userId}");
                    await Groups.RemoveFromGroupAsync(connectionId, $"user_{userId}");
                    Console.WriteLine($"🧹 Kullanıcı eski oyun grubundan çıkarıldı: {game.Id}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"RemoveUserFromAllGameGroups hatası: {ex.Message}");
        }
    }

    public async Task InviteFriend(string friendUserId)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Check if they are friends
            var areFriends = await _friendRepository.AreFriendsAsync(userId, friendUserId);
            if (!areFriends)
            {
                await Clients.Caller.SendAsync("error", "Bu kullanıcı arkadaşınız değil");
                return;
            }

            // Check if friend is online
            var friendConnection = _userConnections.GetValueOrDefault(friendUserId);
            if (string.IsNullOrEmpty(friendConnection))
            {
                await Clients.Caller.SendAsync("error", "Arkadaşınız şu anda çevrimdışı");
                return;
            }

            // Create game invitation
            var game = Game.Create(userId, friendUserId);
            await _gameRepository.AddAsync(game);

            // Store invitation
            if (!_friendInvitations.ContainsKey(friendUserId))
                _friendInvitations[friendUserId] = new List<string>();
            _friendInvitations[friendUserId].Add(game.Id);

            // Send invitation to friend
            await Clients.Client(friendConnection).SendAsync("friendGameInvitation", new
            {
                gameId = game.Id,
                fromUserId = userId,
                fromUsername = (await _userRepository.GetByIdAsync(userId))?.Username
            });

            await Clients.Caller.SendAsync("invitationSent", new { friendUserId });
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("error", ex.Message);
        }
    }

    public async Task RespondToInvitation(string gameId, bool accept)
    {
        try
        {
            var userId = GetCurrentUserId();
            var game = await _gameRepository.GetByIdAsync(gameId);

            if (game == null)
            {
                await Clients.Caller.SendAsync("error", "Oyun bulunamadı");
                return;
            }

            if (game.Player2Id != userId)
            {
                await Clients.Caller.SendAsync("error", "Bu davet size ait değil");
                return;
            }

            // Remove invitation from pending list
            if (_friendInvitations.ContainsKey(userId))
            {
                _friendInvitations[userId].Remove(gameId);
                if (_friendInvitations[userId].Count == 0)
                    _friendInvitations.Remove(userId);
            }

            var player1Connection = _userConnections.GetValueOrDefault(game.Player1Id);

            if (accept)
            {
                // Start the game
                var player2Connection = _userConnections.GetValueOrDefault(game.Player2Id);

                if (!string.IsNullOrEmpty(player1Connection) && !string.IsNullOrEmpty(player2Connection))
                {
                    await Groups.AddToGroupAsync(player1Connection, $"game_{game.Id}");
                    await Groups.AddToGroupAsync(player2Connection, $"game_{game.Id}");

                    await Clients.Client(player1Connection).SendAsync("invitationAccepted", new { gameId = game.Id, isPlayer1 = true, opponentId = game.Player2Id });
                    await Clients.Client(player2Connection).SendAsync("invitationAccepted", new { gameId = game.Id, isPlayer1 = false, opponentId = game.Player1Id });

                    // Start the game after 2 seconds
                    await Task.Delay(2000);
                    game.StartGame();
                    await _gameRepository.UpdateAsync(game);

                    await SendGameState(game);
                }
            }
            else
            {
                // Decline invitation
                if (!string.IsNullOrEmpty(player1Connection))
                {
                    await Clients.Client(player1Connection).SendAsync("invitationDeclined", new { friendUserId = userId });
                }
            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("error", ex.Message);
        }
    }

    public async Task GetOnlineFriends()
    {
        try
        {
            var userId = GetCurrentUserId();
            var onlineFriends = await _friendRepository.GetOnlineFriendsAsync(userId);

            await Clients.Caller.SendAsync("onlineFriends", onlineFriends.Select(f => new
            {
                id = f.Id,
                username = f.Username,
                isOnline = f.IsOnline
            }));
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("error", ex.Message);
        }
    }

    public async Task LeaveGame(string gameId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var game = await _gameRepository.GetByIdAsync(gameId);

            if (game == null)
            {
                Console.WriteLine($"LeaveGame: Oyun bulunamadı - GameId: {gameId}");
                return;
            }

            if (game.Status != GameStatus.InProgress)
            {
                Console.WriteLine($"LeaveGame: Oyun aktif değil - Status: {game.Status}");
                return;
            }

            await LogToAdmin($"LeaveGame çağrıldı - GameId: {gameId}, UserId: {userId}", "Warning");

            // Oyundan ayrılan kullanıcıyı belirle
            var leavingUserId = userId;
            var remainingUserId = game.Player1Id == userId ? game.Player2Id : game.Player1Id;

            // Oyunu tamamla - Rakip kazandı
            game.EndGameWithWinner(remainingUserId);
            await _gameRepository.UpdateAsync(game);

            await LogToAdmin($"Oyun tamamlandı - Kazanan: {remainingUserId}", "Info");

            // Ödülleri dağıt
            await DistributeRewards(game);

            // Maç sonucunu kaydet
            if (remainingUserId != "bot")
            {
                var match = Match.Create(
                    game.Player1Id,
                    game.Player2Id,
                    game.Player1Score,
                    game.Player2Score,
                    GameMode.Online
                );
                await _matchRepository.AddAsync(match);
            }

            // Rakibe bildirim gönder
            var remainingConnection = _userConnections.GetValueOrDefault(remainingUserId);
            if (!string.IsNullOrEmpty(remainingConnection))
            {
                await Clients.Client(remainingConnection).SendAsync("opponentLeft");
                await LogToAdmin($"Rakibe 'opponentLeft' bildirimi gönderildi: {remainingUserId}", "Info");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"LeaveGame hatası: {ex.Message}");
            await Clients.Caller.SendAsync("error", ex.Message);
        }
    }
}