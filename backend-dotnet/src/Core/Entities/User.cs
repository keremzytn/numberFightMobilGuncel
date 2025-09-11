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
}
