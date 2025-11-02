using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Game : BaseEntity
{
    public string Player1Id { get; private set; }
    public string Player2Id { get; private set; }
    public int Player1Score { get; private set; }
    public int Player2Score { get; private set; }
    public GameStatus Status { get; private set; }
    public string? WinnerId { get; private set; }
    public int CurrentRound { get; private set; }
    public GameMode Mode { get; private set; }
    public int EntryFee { get; private set; }
    public bool Player1Paid { get; private set; }
    public bool Player2Paid { get; private set; }
    public int WinnerReward { get; private set; }
    public int LoserReward { get; private set; }
    public int DrawReward { get; private set; }
    public List<int> Player1UsedCards { get; private set; } = new();
    public List<int> Player2UsedCards { get; private set; } = new();
    public List<int> Player1ForbiddenCards { get; private set; } = new();
    public List<int> Player2ForbiddenCards { get; private set; } = new();
    public int? Player1Card { get; private set; }
    public int? Player2Card { get; private set; }
    public DateTime? RoundStartTime { get; private set; }
    public List<GameMove> Moves { get; private set; } = new();

    private Game() { } // EF Core için

    public static Game Create(string player1Id, string player2Id, GameMode mode = GameMode.Online)
    {
        var entryFee = mode == GameMode.Online ? 25 : 10; // Online: 25 gold, Bot: 10 gold
        var winReward = mode == GameMode.Online ? 50 : 10;
        var drawReward = mode == GameMode.Online ? 20 : 5;
        var loseReward = mode == GameMode.Online ? 5 : 2;
        
        return new Game
        {
            Player1Id = player1Id,
            Player2Id = player2Id,
            Player1Score = 0,
            Player2Score = 0,
            Status = GameStatus.Waiting,
            CurrentRound = 1,
            Mode = mode,
            EntryFee = entryFee,
            Player1Paid = false,
            Player2Paid = false,
            WinnerReward = winReward,
            LoserReward = loseReward,
            DrawReward = drawReward
        };
    }

    public void MarkPlayerPaid(string playerId)
    {
        if (playerId == Player1Id)
            Player1Paid = true;
        else if (playerId == Player2Id)
            Player2Paid = true;
    }

    public bool CanStart()
    {
        // Bot maçlarında sadece Player1'in ödemesi gerekir
        if (Mode == GameMode.Bot)
            return Player1Paid;
        
        // Online maçlarda her iki oyuncunun da ödemesi gerekir
        return Player1Paid && Player2Paid;
    }

    public int CalculateReward(string playerId)
    {
        if (WinnerId == playerId)
        {
            // Kazanç bonusları kontrol et
            int bonus = 0;
            if (Mode == GameMode.Online)
            {
                var score = playerId == Player1Id ? Player1Score : Player2Score;
                var opponentScore = playerId == Player1Id ? Player2Score : Player1Score;
                
                // Perfect Game: 7-0
                if (score == 7 && opponentScore == 0)
                    bonus += 50;
                // Close Win: 4-3
                else if (score == 4 && opponentScore == 3)
                    bonus += 10;
            }
            return WinnerReward + bonus;
        }
        else if (WinnerId == null) // Beraberlik
        {
            return DrawReward;
        }
        else // Kaybetme
        {
            return LoserReward;
        }
    }

    public List<int> GetValidCards(string playerId)
    {
        var usedCards = playerId == Player1Id ? Player1UsedCards : Player2UsedCards;
        var forbiddenCards = playerId == Player1Id ? Player1ForbiddenCards : Player2ForbiddenCards;
        var allCards = new List<int> { 1, 2, 3, 4, 5, 6, 7 };

        if (CurrentRound == 7)
        {
            return allCards.Where(card => !usedCards.Contains(card)).ToList();
        }

        return allCards.Where(card => !usedCards.Contains(card) && !forbiddenCards.Contains(card)).ToList();
    }

    public void PlayCard(string playerId, int cardNumber)
    {
        if (Status != GameStatus.InProgress)
            throw new InvalidOperationException("Oyun başlamamış veya bitmiş durumda");

        var validCards = GetValidCards(playerId);
        if (!validCards.Contains(cardNumber))
            throw new InvalidOperationException("Geçersiz kart seçimi");

        if (playerId == Player1Id)
        {
            if (Player1Card.HasValue)
                throw new InvalidOperationException("Bu el için zaten kart oynamışsınız");
            Player1Card = cardNumber;
        }
        else if (playerId == Player2Id)
        {
            if (Player2Card.HasValue)
                throw new InvalidOperationException("Bu el için zaten kart oynamışsınız");
            Player2Card = cardNumber;
        }
        else
        {
            throw new InvalidOperationException("Bu oyunun oyuncusu değilsiniz");
        }

        var move = new GameMove
        {
            Id = Guid.NewGuid().ToString(),
            PlayerId = playerId,
            Number = cardNumber,
            CreatedAt = DateTime.UtcNow
        };
        Moves.Add(move);
    }

    public void ResolveRound()
    {
        if (!Player1Card.HasValue || !Player2Card.HasValue)
            return;

        // Kartları kullanılmış kartlara ekle
        Player1UsedCards.Add(Player1Card.Value);
        Player2UsedCards.Add(Player2Card.Value);

        // Kazananı belirle
        if (Player1Card.Value > Player2Card.Value)
        {
            Player1Score++;
            UpdateForbiddenCards(Player1Id, Player1Card.Value);
            UpdateForbiddenCards(Player2Id, Player2Card.Value);
        }
        else if (Player2Card.Value > Player1Card.Value)
        {
            Player2Score++;
            UpdateForbiddenCards(Player1Id, Player1Card.Value);
            UpdateForbiddenCards(Player2Id, Player2Card.Value);
        }

        // Sonraki round'a geç
        CurrentRound++;
        Player1Card = null;
        Player2Card = null;
        RoundStartTime = DateTime.UtcNow;

        // Oyun bitti mi kontrol et
        if (CurrentRound > 7)
        {
            Status = GameStatus.Completed;
            WinnerId = Player1Score > Player2Score ? Player1Id :
                      Player2Score > Player1Score ? Player2Id : null;
        }
    }

    private void UpdateForbiddenCards(string playerId, int lastPlayedCard)
    {
        var forbiddenCards = new List<int>();
        if (lastPlayedCard > 1)
            forbiddenCards.Add(lastPlayedCard - 1);
        if (lastPlayedCard < 7)
            forbiddenCards.Add(lastPlayedCard + 1);

        var usedCards = playerId == Player1Id ? Player1UsedCards : Player2UsedCards;
        var validForbiddenCards = forbiddenCards.Where(card => !usedCards.Contains(card)).ToList();

        if (playerId == Player1Id)
            Player1ForbiddenCards = validForbiddenCards;
        else
            Player2ForbiddenCards = validForbiddenCards;
    }

    public void StartGame()
    {
        if (Status != GameStatus.Waiting)
            throw new InvalidOperationException("Oyun zaten başlamış veya bitmiş");

        Status = GameStatus.InProgress;
        RoundStartTime = DateTime.UtcNow;
    }

    public void HandleTimeout()
    {
        if (Status != GameStatus.InProgress)
            return;

        // Kart oynamamış oyuncular için otomatik en düşük kartı oyna
        if (!Player1Card.HasValue)
        {
            var validCards = GetValidCards(Player1Id);
            if (validCards.Any())
                PlayCard(Player1Id, validCards.Min());
        }

        if (!Player2Card.HasValue)
        {
            var validCards = GetValidCards(Player2Id);
            if (validCards.Any())
                PlayCard(Player2Id, validCards.Min());
        }
    }

    public void EndGameWithWinner(string winnerId)
    {
        if (Status != GameStatus.InProgress)
            throw new InvalidOperationException("Oyun aktif değil");

        Status = GameStatus.Completed;
        WinnerId = winnerId;
    }
}