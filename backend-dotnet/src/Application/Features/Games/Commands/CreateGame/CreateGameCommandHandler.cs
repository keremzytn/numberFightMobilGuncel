using MediatR;
using AutoMapper;
using Core.Entities;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Games.Commands.CreateGame;

public class CreateGameCommandHandler : IRequestHandler<CreateGameCommand, GameDto>
{
    private readonly IGameRepository _gameRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public CreateGameCommandHandler(
        IGameRepository gameRepository,
        IUserRepository userRepository,
        IMapper mapper)
    {
        _gameRepository = gameRepository;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<GameDto> Handle(CreateGameCommand request, CancellationToken cancellationToken)
    {
        // Kullanıcıları kontrol et
        var player1 = await _userRepository.GetByIdAsync(request.Player1Id);
        var player2 = await _userRepository.GetByIdAsync(request.Player2Id);

        if (player1 == null)
            throw new KeyNotFoundException($"Player1 ID: {request.Player1Id} bulunamadı");
        if (player2 == null)
            throw new KeyNotFoundException($"Player2 ID: {request.Player2Id} bulunamadı");

        var game = Game.Create(request.Player1Id, request.Player2Id, request.Mode);
        
        // Giriş ücretini çek
        try
        {
            player1.RemoveGold(game.EntryFee);
            game.MarkPlayerPaid(request.Player1Id);
            
            // Bot maçı değilse player2'den de çek
            if (request.Mode == GameMode.Online)
            {
                player2.RemoveGold(game.EntryFee);
                game.MarkPlayerPaid(request.Player2Id);
            }
            else // Bot maçı
            {
                game.MarkPlayerPaid(request.Player2Id); // Bot ücretsiz
            }
        }
        catch (InvalidOperationException)
        {
            throw new InvalidOperationException("Yetersiz gold miktarı");
        }

        await _gameRepository.AddAsync(game);

        return _mapper.Map<GameDto>(game);
    }
}
