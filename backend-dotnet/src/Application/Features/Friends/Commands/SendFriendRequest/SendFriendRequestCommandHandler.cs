using MediatR;
using AutoMapper;
using Core.Entities;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Friends.Commands.SendFriendRequest;

public class SendFriendRequestCommandHandler : IRequestHandler<SendFriendRequestCommand, FriendDto>
{
    private readonly IFriendRepository _friendRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public SendFriendRequestCommandHandler(IFriendRepository friendRepository, IUserRepository userRepository, IMapper mapper)
    {
        _friendRepository = friendRepository;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<FriendDto> Handle(SendFriendRequestCommand request, CancellationToken cancellationToken)
    {
        // Validate users exist
        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null)
            throw new KeyNotFoundException("Kullanıcı bulunamadı");

        var friendUser = await _userRepository.GetByIdAsync(request.FriendUserId);
        if (friendUser == null)
            throw new KeyNotFoundException("Arkadaş eklenecek kullanıcı bulunamadı");

        // Check if they are the same user
        if (request.UserId == request.FriendUserId)
            throw new InvalidOperationException("Kendinizi arkadaş olarak ekleyemezsiniz");

        // Check if friendship already exists
        var existingFriendship = await _friendRepository.GetFriendshipAsync(request.UserId, request.FriendUserId);
        if (existingFriendship != null)
        {
            if (existingFriendship.Status == FriendshipStatus.Accepted)
                throw new InvalidOperationException("Bu kullanıcı zaten arkadaşınız");
            if (existingFriendship.Status == FriendshipStatus.Pending)
                throw new InvalidOperationException("Bu kullanıcıya zaten arkadaşlık isteği gönderilmiş");
            if (existingFriendship.Status == FriendshipStatus.Blocked)
                throw new InvalidOperationException("Bu kullanıcı engellenmiş");
        }

        // Create friend request
        var friend = Friend.Create(request.UserId, request.FriendUserId);
        await _friendRepository.AddAsync(friend);

        // Load navigation properties
        friend = await _friendRepository.GetByIdAsync(friend.Id);

        return _mapper.Map<FriendDto>(friend);
    }
}