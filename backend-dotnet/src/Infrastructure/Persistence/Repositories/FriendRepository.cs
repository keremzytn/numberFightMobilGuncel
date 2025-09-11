using Microsoft.EntityFrameworkCore;
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Persistence.Repositories;

public class FriendRepository : IFriendRepository
{
    private readonly AppDbContext _context;

    public FriendRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Friend?> GetByIdAsync(string id)
    {
        return await _context.Friends
            .Include(f => f.User)
            .Include(f => f.FriendUser)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<Friend?> GetFriendshipAsync(string userId, string friendUserId)
    {
        return await _context.Friends
            .Include(f => f.User)
            .Include(f => f.FriendUser)
            .FirstOrDefaultAsync(f => 
                (f.UserId == userId && f.FriendUserId == friendUserId) ||
                (f.UserId == friendUserId && f.FriendUserId == userId));
    }

    public async Task<List<Friend>> GetUserFriendsAsync(string userId, FriendshipStatus? status = null)
    {
        var query = _context.Friends
            .Include(f => f.User)
            .Include(f => f.FriendUser)
            .Where(f => (f.UserId == userId || f.FriendUserId == userId));

        if (status.HasValue)
        {
            query = query.Where(f => f.Status == status.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<List<Friend>> GetPendingRequestsAsync(string userId)
    {
        return await _context.Friends
            .Include(f => f.User)
            .Include(f => f.FriendUser)
            .Where(f => f.FriendUserId == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();
    }

    public async Task<List<Friend>> GetSentRequestsAsync(string userId)
    {
        return await _context.Friends
            .Include(f => f.User)
            .Include(f => f.FriendUser)
            .Where(f => f.UserId == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();
    }

    public async Task<bool> AreFriendsAsync(string userId, string friendUserId)
    {
        return await _context.Friends
            .AnyAsync(f => 
                ((f.UserId == userId && f.FriendUserId == friendUserId) ||
                 (f.UserId == friendUserId && f.FriendUserId == userId)) &&
                f.Status == FriendshipStatus.Accepted);
    }

    public async Task<bool> HasPendingRequestAsync(string fromUserId, string toUserId)
    {
        return await _context.Friends
            .AnyAsync(f => f.UserId == fromUserId && f.FriendUserId == toUserId && f.Status == FriendshipStatus.Pending);
    }

    public async Task AddAsync(Friend friend)
    {
        await _context.Friends.AddAsync(friend);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Friend friend)
    {
        _context.Friends.Update(friend);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Friend friend)
    {
        _context.Friends.Remove(friend);
        await _context.SaveChangesAsync();
    }

    public async Task<List<User>> GetOnlineFriendsAsync(string userId)
    {
        return await _context.Friends
            .Where(f => 
                ((f.UserId == userId || f.FriendUserId == userId) && f.Status == FriendshipStatus.Accepted))
            .Select(f => f.UserId == userId ? f.FriendUser : f.User)
            .Where(u => u.IsOnline)
            .ToListAsync();
    }

    public async Task<List<User>> SearchUsersAsync(string searchTerm, string currentUserId)
    {
        return await _context.Users
            .Where(u => u.Id != currentUserId && 
                       (u.Username.Contains(searchTerm) || u.Email.Contains(searchTerm)))
            .Take(20)
            .ToListAsync();
    }
}