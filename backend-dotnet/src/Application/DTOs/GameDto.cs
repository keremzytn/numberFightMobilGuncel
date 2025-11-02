using Core.Entities;

namespace Application.DTOs;

public class GameDto
{
    public string Id { get; set; }
    public string Player1Id { get; set; }
    public string Player2Id { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public GameStatus Status { get; set; }
    public string? WinnerId { get; set; }
    public List<GameMoveDto> Moves { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public GameMode Mode { get; set; }
    public int EntryFee { get; set; }
    public int WinnerReward { get; set; }
    public int LoserReward { get; set; }
    public int DrawReward { get; set; }
}

public class GameMoveDto
{
    public string PlayerId { get; set; }
    public int Number { get; set; }
    public DateTime CreatedAt { get; set; }
}
