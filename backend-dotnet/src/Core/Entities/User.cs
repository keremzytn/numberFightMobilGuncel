using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class User : BaseEntity
{
    [Required]
    public string Username { get; private set; }

    [Required]
    [EmailAddress]
    public string Email { get; private set; }

    [Required]
    public string PasswordHash { get; private set; }

    public int Gold { get; private set; }

    public bool IsOnline { get; private set; }

    public DateTime? LastSeenAt { get; private set; }

    public bool IsBanned { get; private set; }

    public DateTime? BannedAt { get; private set; }

    public string? BanReason { get; private set; }

    public DateTime? BannedUntil { get; private set; }

    // Navigation properties for friendships
    public virtual ICollection<Friend> SentFriendRequests { get; private set; } = new List<Friend>();
    public virtual ICollection<Friend> ReceivedFriendRequests { get; private set; } = new List<Friend>();

    private User() { } // EF Core için

    public static User Create(string username, string email, string passwordHash)
    {
        return new User
        {
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            Gold = 0
        };
    }

    public void AddGold(int amount)
    {
        if (amount < 0) throw new InvalidOperationException("Gold miktarı negatif olamaz");
        Gold += amount;
    }

    public void RemoveGold(int amount)
    {
        if (amount < 0) throw new InvalidOperationException("Gold miktarı negatif olamaz");
        if (Gold < amount) throw new InvalidOperationException("Yetersiz gold miktarı");
        Gold -= amount;
    }

    public void SetOnlineStatus(bool isOnline)
    {
        IsOnline = isOnline;
        if (!isOnline)
        {
            LastSeenAt = DateTime.UtcNow;
        }
    }

    public void Ban(string reason, DateTime? until = null)
    {
        IsBanned = true;
        BannedAt = DateTime.UtcNow;
        BanReason = reason;
        BannedUntil = until;
    }

    public void Unban()
    {
        IsBanned = false;
        BannedAt = null;
        BanReason = null;
        BannedUntil = null;
    }

    public bool IsCurrentlyBanned()
    {
        if (!IsBanned) return false;
        if (BannedUntil.HasValue && BannedUntil.Value < DateTime.UtcNow)
        {
            Unban();
            return false;
        }
        return true;
    }
}
