using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Games.Commands.MakeMove;

public class MakeMoveCommandHandler : IRequestHandler<MakeMoveCommand, GameDto>
{
    private readonly IGameRepository _gameRepository;
    private readonly IMapper _mapper;

    public MakeMoveCommandHandler(IGameRepository gameRepository, IMapper mapper)
    {
        _gameRepository = gameRepository;
        _mapper = mapper;
    }

    public async Task<GameDto> Handle(MakeMoveCommand request, CancellationToken cancellationToken)
    {
        var game = await _gameRepository.GetByIdAsync(request.GameId);
        if (game == null)
            throw new KeyNotFoundException($"Game ID: {request.GameId} bulunamadı");

        game.PlayCard(request.PlayerId, request.Number);
        await _gameRepository.UpdateAsync(game);

        return _mapper.Map<GameDto>(game);
    }
}