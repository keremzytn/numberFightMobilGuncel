using Core.Entities;

namespace API.Models.Filters;

public class GameFilter
{
    public string? PlayerId { get; set; }
    public GameStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? WinnerId { get; set; }
    public int? MinScore { get; set; }
    public string? SortBy { get; set; } // CreatedAt, Status
    public bool SortDescending { get; set; } = true;
}

