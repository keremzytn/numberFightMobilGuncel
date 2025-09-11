using Core.Entities;

namespace Application.DTOs;

public class MatchDto
{
    public string Id { get; set; }
    public string Player1Id { get; set; }
    public string Player2Id { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public string? WinnerId { get; set; }
    public GameMode Mode { get; set; }
    public DateTime CreatedAt { get; set; }
}
