using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Friends.Queries.GetFriends;

public class GetFriendsQueryHandler : IRequestHandler<GetFriendsQuery, List<FriendDto>>
{
    private readonly IFriendRepository _friendRepository;
    private readonly IMapper _mapper;

    public GetFriendsQueryHandler(IFriendRepository friendRepository, IMapper mapper)
    {
        _friendRepository = friendRepository;
        _mapper = mapper;
    }

    public async Task<List<FriendDto>> Handle(GetFriendsQuery request, CancellationToken cancellationToken)
    {
        var friends = await _friendRepository.GetUserFriendsAsync(request.UserId, request.Status);
        return _mapper.Map<List<FriendDto>>(friends);
    }
}