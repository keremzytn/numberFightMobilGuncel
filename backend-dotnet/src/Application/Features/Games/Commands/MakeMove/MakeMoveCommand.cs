using MediatR;
using Application.DTOs;

namespace Application.Features.Games.Commands.MakeMove;

public record MakeMoveCommand(string GameId, string PlayerId, int Number) : IRequest<GameDto>;
