using MediatR;
using Core.Services;

namespace Application.Features.Stats.Queries.GetGameStats;

public class GetGameStatsQueryHandler : IRequestHandler<GetGameStatsQuery, GameStats>
{
    private readonly GameStatsService _statsService;

    public GetGameStatsQueryHandler(GameStatsService statsService)
    {
        _statsService = statsService;
    }

    public async Task<GameStats> Handle(GetGameStatsQuery request, CancellationToken cancellationToken)
    {
        return await _statsService.GetGameStats();
    }
}
