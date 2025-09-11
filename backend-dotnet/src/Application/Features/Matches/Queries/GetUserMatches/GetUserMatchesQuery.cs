using MediatR;
using Application.DTOs;

namespace Application.Features.Matches.Queries.GetUserMatches;

public record GetUserMatchesQuery(string UserId) : IRequest<IEnumerable<MatchDto>>;
