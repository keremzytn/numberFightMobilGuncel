using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Friend : BaseEntity
{
    [Required]
    public string UserId { get; private set; }
    
    [Required]
    public string FriendUserId { get; private set; }
    
    public FriendshipStatus Status { get; private set; }
    
    public DateTime RequestedAt { get; private set; }
    
    public DateTime? AcceptedAt { get; private set; }

    // Navigation properties
    public virtual User User { get; private set; }
    public virtual User FriendUser { get; private set; }

    private Friend() { } // EF Core için

    public static Friend Create(string userId, string friendUserId)
    {
        return new Friend
        {
            UserId = userId,
            FriendUserId = friendUserId,
            Status = FriendshipStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };
    }

    public void Accept()
    {
        if (Status != FriendshipStatus.Pending)
            throw new InvalidOperationException("Sadece bekleyen arkadaşlık istekleri kabul edilebilir");

        Status = FriendshipStatus.Accepted;
        AcceptedAt = DateTime.UtcNow;
    }

    public void Decline()
    {
        if (Status != FriendshipStatus.Pending)
            throw new InvalidOperationException("Sadece bekleyen arkadaşlık istekleri reddedilebilir");

        Status = FriendshipStatus.Declined;
    }

    public void Block()
    {
        Status = FriendshipStatus.Blocked;
    }
}