using MediatR;
using Core.Services;

namespace Application.Features.Stats.Queries.GetUserStats;

public class GetUserStatsQueryHandler : IRequestHandler<GetUserStatsQuery, UserStats>
{
    private readonly GameStatsService _statsService;

    public GetUserStatsQueryHandler(GameStatsService statsService)
    {
        _statsService = statsService;
    }

    public async Task<UserStats> Handle(GetUserStatsQuery request, CancellationToken cancellationToken)
    {
        return await _statsService.GetUserStats(request.UserId);
    }
}
