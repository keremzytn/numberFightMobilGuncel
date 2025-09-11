using MediatR;
using Application.DTOs;

namespace Application.Features.Friends.Commands.SendFriendRequest;

public record SendFriendRequestCommand(string UserId, string FriendUserId) : IRequest<FriendDto>;