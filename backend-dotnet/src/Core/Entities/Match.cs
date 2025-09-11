namespace Core.Entities;

public class Match : BaseEntity
{
    public string Player1Id { get; private set; }
    public string Player2Id { get; private set; }
    public int Player1Score { get; private set; }
    public int Player2Score { get; private set; }
    public string? WinnerId { get; private set; }
    public GameMode Mode { get; private set; }

    private Match() { } // EF Core için

    public static Match Create(
        string player1Id, 
        string player2Id, 
        int player1Score, 
        int player2Score, 
        GameMode mode)
    {
        var match = new Match
        {
            Player1Id = player1Id,
            Player2Id = player2Id,
            Player1Score = player1Score,
            Player2Score = player2Score,
            Mode = mode
        };

        match.WinnerId = player1Score > player2Score ? player1Id :
                        player2Score > player1Score ? player2Id : null;

        return match;
    }
}
