using MediatR;
using Application.DTOs;

namespace Application.Features.Games.Queries.GetGame;

public record GetGameQuery(string Id) : IRequest<GameDto>;
