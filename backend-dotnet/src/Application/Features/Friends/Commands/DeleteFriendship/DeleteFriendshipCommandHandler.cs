using MediatR;
using Core.Interfaces;

namespace Application.Features.Friends.Commands.DeleteFriendship;

public class DeleteFriendshipCommandHandler : IRequestHandler<DeleteFriendshipCommand, bool>
{
    private readonly IFriendRepository _friendRepository;

    public DeleteFriendshipCommandHandler(IFriendRepository friendRepository)
    {
        _friendRepository = friendRepository;
    }

    public async Task<bool> Handle(DeleteFriendshipCommand request, CancellationToken cancellationToken)
    {
        // GetFriendshipAsync zaten iki yönlü kontrol yapıyor
        var friendship = await _friendRepository.GetFriendshipAsync(request.UserId, request.FriendUserId);

        if (friendship == null)
            throw new KeyNotFoundException("Arkadaşlık ilişkisi bulunamadı");

        await _friendRepository.DeleteAsync(friendship);
        return true;
    }
}

