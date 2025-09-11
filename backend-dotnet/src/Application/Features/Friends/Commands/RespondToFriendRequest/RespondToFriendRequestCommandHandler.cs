using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Friends.Commands.RespondToFriendRequest;

public class RespondToFriendRequestCommandHandler : IRequestHandler<RespondToFriendRequestCommand, FriendDto>
{
    private readonly IFriendRepository _friendRepository;
    private readonly IMapper _mapper;

    public RespondToFriendRequestCommandHandler(IFriendRepository friendRepository, IMapper mapper)
    {
        _friendRepository = friendRepository;
        _mapper = mapper;
    }

    public async Task<FriendDto> Handle(RespondToFriendRequestCommand request, CancellationToken cancellationToken)
    {
        var friendRequest = await _friendRepository.GetByIdAsync(request.FriendRequestId);
        if (friendRequest == null)
            throw new KeyNotFoundException("Arkadaşlık isteği bulunamadı");

        // Verify that the current user is the recipient of the friend request
        if (friendRequest.FriendUserId != request.UserId)
            throw new UnauthorizedAccessException("Bu arkadaşlık isteğini yanıtlama yetkiniz yok");

        // Respond to the friend request
        if (request.Accept)
        {
            friendRequest.Accept();
        }
        else
        {
            friendRequest.Decline();
        }

        await _friendRepository.UpdateAsync(friendRequest);

        return _mapper.Map<FriendDto>(friendRequest);
    }
}