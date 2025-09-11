using MediatR;
using Core.Entities;
using Application.DTOs;

namespace Application.Features.Matches.Commands.CreateMatch;

public record CreateMatchCommand(
    string Player1Id,
    string Player2Id,
    int Player1Score,
    int Player2Score,
    GameMode Mode) : IRequest<MatchDto>;
