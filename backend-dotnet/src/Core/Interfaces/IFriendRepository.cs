using Core.Entities;

namespace Core.Interfaces;

public interface IFriendRepository
{
    Task<Friend?> GetByIdAsync(string id);
    Task<Friend?> GetFriendshipAsync(string userId, string friendUserId);
    Task<List<Friend>> GetUserFriendsAsync(string userId, FriendshipStatus? status = null);
    Task<List<Friend>> GetPendingRequestsAsync(string userId);
    Task<List<Friend>> GetSentRequestsAsync(string userId);
    Task<bool> AreFriendsAsync(string userId, string friendUserId);
    Task<bool> HasPendingRequestAsync(string fromUserId, string toUserId);
    Task<IEnumerable<Friend>> GetAllFriendshipsAsync();
    Task AddAsync(Friend friend);
    Task UpdateAsync(Friend friend);
    Task DeleteAsync(Friend friend);
    Task<List<User>> GetOnlineFriendsAsync(string userId);
    Task<List<User>> SearchUsersAsync(string searchTerm, string currentUserId);
}