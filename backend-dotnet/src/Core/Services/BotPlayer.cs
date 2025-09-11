using Core.Entities;

namespace Core.Services;

public class BotPlayer
{
    private readonly Random _random = new();

    public int SelectCard(List<int> validCards, Game gameState)
    {
        if (validCards.Count == 0)
            throw new InvalidOperationException("Oynanabilecek kart yok");

        // Basit bot stratejisi:
        // 1. Son round ise en yüksek kartı oyna
        if (gameState.CurrentRound == 7)
            return validCards.Max();

        // 2. Rakip önde ise yüksek kart oyna
        if (gameState.Player1Score > gameState.Player2Score)
        {
            var highCards = validCards.Where(c => c >= 5).ToList();
            if (highCards.Any())
                return highCards[_random.Next(highCards.Count)];
        }

        // 3. Biz önde isek düşük kart oyna
        if (gameState.Player2Score > gameState.Player1Score)
        {
            var lowCards = validCards.Where(c => c <= 3).ToList();
            if (lowCards.Any())
                return lowCards[_random.Next(lowCards.Count)];
        }

        // 4. Berabere ise rastgele kart oyna
        return validCards[_random.Next(validCards.Count)];
    }
}
