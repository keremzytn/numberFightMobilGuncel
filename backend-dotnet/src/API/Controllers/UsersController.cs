using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.DTOs;
using Application.Features.Users.Commands.CreateUser;
using Application.Features.Users.Commands.LoginUser;
using Application.Features.Users.Queries.GetUserById;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(string id)
    {
        try
        {
            var user = await _mediator.Send(new GetUserByIdQuery(id));
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] CreateUserCommand command)
    {
        try
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Register hatası: {ex.Message}");
            Console.WriteLine($"InnerException: {ex.InnerException?.Message}");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginUserCommand command)
    {
        try
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }
}