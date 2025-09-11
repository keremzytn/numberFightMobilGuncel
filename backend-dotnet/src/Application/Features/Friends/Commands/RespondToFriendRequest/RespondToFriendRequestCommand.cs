using MediatR;
using Application.DTOs;

namespace Application.Features.Friends.Commands.RespondToFriendRequest;

public record RespondToFriendRequestCommand(string FriendRequestId, string UserId, bool Accept) : IRequest<FriendDto>;