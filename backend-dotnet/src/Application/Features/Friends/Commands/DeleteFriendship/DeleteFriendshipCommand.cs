using MediatR;

namespace Application.Features.Friends.Commands.DeleteFriendship;

public record DeleteFriendshipCommand(string UserId, string FriendUserId) : IRequest<bool>;

