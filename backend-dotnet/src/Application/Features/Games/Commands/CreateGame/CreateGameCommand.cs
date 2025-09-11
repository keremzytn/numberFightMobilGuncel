using MediatR;
using Application.DTOs;

namespace Application.Features.Games.Commands.CreateGame;

public record CreateGameCommand(string Player1Id, string Player2Id) : IRequest<GameDto>;
