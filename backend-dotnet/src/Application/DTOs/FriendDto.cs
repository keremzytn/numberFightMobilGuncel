namespace Application.DTOs;

public class FriendDto
{
    public string Id { get; set; }
    public string UserId { get; set; }
    public string FriendUserId { get; set; }
    public string Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public UserDto User { get; set; }
    public UserDto FriendUser { get; set; }
}

public class FriendRequestDto
{
    public string FriendUserId { get; set; }
}

public class FriendResponseDto
{
    public string FriendRequestId { get; set; }
    public bool Accept { get; set; }
}