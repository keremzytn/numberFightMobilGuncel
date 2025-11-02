using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;
using Core.Entities;

namespace Application.Features.Games.Commands.MakeMove;

public class MakeMoveCommandHandler : IRequestHandler<MakeMoveCommand, GameDto>
{
    private readonly IGameRepository _gameRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public MakeMoveCommandHandler(
        IGameRepository gameRepository, 
        IUserRepository userRepository,
        IMapper mapper)
    {
        _gameRepository = gameRepository;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<GameDto> Handle(MakeMoveCommand request, CancellationToken cancellationToken)
    {
        var game = await _gameRepository.GetByIdAsync(request.GameId);
        if (game == null)
            throw new KeyNotFoundException($"Game ID: {request.GameId} bulunamadı");

        game.PlayCard(request.PlayerId, request.Number);
        game.ResolveRound();
        
        // Oyun bittiyse ödülleri dağıt
        if (game.Status == GameStatus.Completed)
        {
            await DistributeRewards(game);
        }
        
        await _gameRepository.UpdateAsync(game);

        return _mapper.Map<GameDto>(game);
    }

    private async Task DistributeRewards(Game game)
    {
        var player1 = await _userRepository.GetByIdAsync(game.Player1Id);
        var player2 = await _userRepository.GetByIdAsync(game.Player2Id);

        if (player1 == null || player2 == null)
            return;

        var player1Reward = game.CalculateReward(game.Player1Id);
        var player2Reward = game.CalculateReward(game.Player2Id);

        player1.AddGold(player1Reward);
        
        // Bot maçı değilse player2'ye de ödül ver
        if (game.Mode == GameMode.Online)
        {
            player2.AddGold(player2Reward);
        }
    }
}