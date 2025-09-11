using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Matches.Queries.GetUserMatches;

public class GetUserMatchesQueryHandler : IRequestHandler<GetUserMatchesQuery, IEnumerable<MatchDto>>
{
    private readonly IMatchRepository _matchRepository;
    private readonly IMapper _mapper;

    public GetUserMatchesQueryHandler(IMatchRepository matchRepository, IMapper mapper)
    {
        _matchRepository = matchRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MatchDto>> Handle(GetUserMatchesQuery request, CancellationToken cancellationToken)
    {
        var matches = await _matchRepository.GetUserMatchesAsync(request.UserId);
        return _mapper.Map<IEnumerable<MatchDto>>(matches);
    }
}
