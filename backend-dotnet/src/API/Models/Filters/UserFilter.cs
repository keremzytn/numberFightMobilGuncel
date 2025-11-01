namespace API.Models.Filters;

public class UserFilter
{
    public string? SearchQuery { get; set; }
    public bool? IsOnline { get; set; }
    public bool? IsBanned { get; set; }
    public DateTime? RegisteredAfter { get; set; }
    public DateTime? RegisteredBefore { get; set; }
    public int? MinGold { get; set; }
    public int? MaxGold { get; set; }
    public string? SortBy { get; set; } // Username, Gold, CreatedAt, LastSeenAt
    public bool SortDescending { get; set; } = true;
}

