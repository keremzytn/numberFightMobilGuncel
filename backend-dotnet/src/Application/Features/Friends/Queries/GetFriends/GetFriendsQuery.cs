using MediatR;
using Application.DTOs;
using Core.Entities;

namespace Application.Features.Friends.Queries.GetFriends;

public record GetFriendsQuery(string UserId, FriendshipStatus? Status = null) : IRequest<List<FriendDto>>;