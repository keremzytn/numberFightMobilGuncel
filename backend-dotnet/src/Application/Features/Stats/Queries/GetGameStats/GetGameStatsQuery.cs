using MediatR;
using Core.Services;

namespace Application.Features.Stats.Queries.GetGameStats;

public record GetGameStatsQuery() : IRequest<GameStats>;
