using MediatR;
using AutoMapper;
using Core.Entities;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Matches.Commands.CreateMatch;

public class CreateMatchCommandHandler : IRequestHandler<CreateMatchCommand, MatchDto>
{
    private readonly IMatchRepository _matchRepository;
    private readonly IMapper _mapper;

    public CreateMatchCommandHandler(IMatchRepository matchRepository, IMapper mapper)
    {
        _matchRepository = matchRepository;
        _mapper = mapper;
    }

    public async Task<MatchDto> Handle(CreateMatchCommand request, CancellationToken cancellationToken)
    {
        var match = Match.Create(
            request.Player1Id,
            request.Player2Id,
            request.Player1Score,
            request.Player2Score,
            request.Mode
        );

        await _matchRepository.AddAsync(match);
        return _mapper.Map<MatchDto>(match);
    }
}
