using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Friends.Queries.SearchUsers;

public class SearchUsersQueryHandler : IRequestHandler<SearchUsersQuery, List<UserDto>>
{
    private readonly IFriendRepository _friendRepository;
    private readonly IMapper _mapper;

    public SearchUsersQueryHandler(IFriendRepository friendRepository, IMapper mapper)
    {
        _friendRepository = friendRepository;
        _mapper = mapper;
    }

    public async Task<List<UserDto>> Handle(SearchUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _friendRepository.SearchUsersAsync(request.SearchTerm, request.CurrentUserId);
        return _mapper.Map<List<UserDto>>(users);
    }
}