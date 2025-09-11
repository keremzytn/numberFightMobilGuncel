using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using Core.Services;
using Application.Features.Stats.Queries.GetGameStats;
using Application.Features.Stats.Queries.GetUserStats;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StatsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("game")]
    public async Task<ActionResult<GameStats>> GetGameStats()
    {
        var stats = await _mediator.Send(new GetGameStatsQuery());
        return Ok(stats);
    }

    [Authorize]
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<UserStats>> GetUserStats(string userId)
    {
        var stats = await _mediator.Send(new GetUserStatsQuery(userId));
        return Ok(stats);
    }
}
