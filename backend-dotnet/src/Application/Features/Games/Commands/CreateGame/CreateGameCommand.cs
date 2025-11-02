using MediatR;
using Application.DTOs;
using Core.Entities;

namespace Application.Features.Games.Commands.CreateGame;

public record CreateGameCommand(string Player1Id, string Player2Id, GameMode Mode = GameMode.Online) : IRequest<GameDto>;
