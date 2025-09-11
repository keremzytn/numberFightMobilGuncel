using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using Application.DTOs;
using Application.Features.Matches.Commands.CreateMatch;
using Application.Features.Matches.Queries.GetUserMatches;

namespace API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly IMediator _mediator;

    public MatchesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetUserMatches(string userId)
    {
        var matches = await _mediator.Send(new GetUserMatchesQuery(userId));
        return Ok(matches);
    }

    [HttpPost]
    public async Task<ActionResult<MatchDto>> Create([FromBody] CreateMatchCommand command)
    {
        var match = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetUserMatches), new { userId = match.Player1Id }, match);
    }
}
