using MediatR;
using Core.Services;

namespace Application.Features.Stats.Queries.GetUserStats;

public record GetUserStatsQuery(string UserId) : IRequest<UserStats>;
