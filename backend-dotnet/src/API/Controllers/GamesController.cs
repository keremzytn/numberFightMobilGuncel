using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using Application.DTOs;
using Application.Features.Games.Commands.CreateGame;
using Application.Features.Games.Commands.MakeMove;
using Application.Features.Games.Queries.GetGame;

namespace API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IMediator _mediator;

    public GamesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GameDto>> GetById(string id)
    {
        try
        {
            var game = await _mediator.Send(new GetGameQuery(id));
            return Ok(game);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    public async Task<ActionResult<GameDto>> Create([FromBody] CreateGameCommand command)
    {
        try
        {
            var game = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = game.Id }, game);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{id}/moves")]
    public async Task<ActionResult<GameDto>> MakeMove(string id, [FromBody] MakeMoveCommand command)
    {
        if (id != command.GameId)
            return BadRequest("Game ID'leri eşleşmiyor");

        try
        {
            var game = await _mediator.Send(command);
            return Ok(game);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}