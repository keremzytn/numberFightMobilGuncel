using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using Application.DTOs;
using Application.Features.Friends.Commands.SendFriendRequest;
using Application.Features.Friends.Commands.RespondToFriendRequest;
using Application.Features.Friends.Queries.GetFriends;
using Application.Features.Friends.Queries.SearchUsers;
using Core.Entities;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FriendsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? throw new UnauthorizedAccessException("Kullanıcı kimliği bulunamadı");
    }

    [HttpGet]
    public async Task<ActionResult<List<FriendDto>>> GetFriends([FromQuery] string? status = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            FriendshipStatus? friendshipStatus = null;
            
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<FriendshipStatus>(status, true, out var parsedStatus))
            {
                friendshipStatus = parsedStatus;
            }

            var friends = await _mediator.Send(new GetFriendsQuery(userId, friendshipStatus));
            return Ok(friends);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("pending-requests")]
    public async Task<ActionResult<List<FriendDto>>> GetPendingRequests()
    {
        try
        {
            var userId = GetCurrentUserId();
            var pendingRequests = await _mediator.Send(new GetFriendsQuery(userId, FriendshipStatus.Pending));
            
            // Filter to only show requests where current user is the recipient
            var incomingRequests = pendingRequests.Where(f => f.FriendUserId == userId).ToList();
            return Ok(incomingRequests);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("sent-requests")]
    public async Task<ActionResult<List<FriendDto>>> GetSentRequests()
    {
        try
        {
            var userId = GetCurrentUserId();
            var pendingRequests = await _mediator.Send(new GetFriendsQuery(userId, FriendshipStatus.Pending));
            
            // Filter to only show requests where current user is the sender
            var sentRequests = pendingRequests.Where(f => f.UserId == userId).ToList();
            return Ok(sentRequests);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("send-request")]
    public async Task<ActionResult<FriendDto>> SendFriendRequest([FromBody] FriendRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var friend = await _mediator.Send(new SendFriendRequestCommand(userId, request.FriendUserId));
            return CreatedAtAction(nameof(GetFriends), friend);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("respond")]
    public async Task<ActionResult<FriendDto>> RespondToFriendRequest([FromBody] FriendResponseDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var friend = await _mediator.Send(new RespondToFriendRequestCommand(request.FriendRequestId, userId, request.Accept));
            return Ok(friend);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<UserDto>>> SearchUsers([FromQuery] string searchTerm)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchTerm) || searchTerm.Length < 2)
            {
                return BadRequest("Arama terimi en az 2 karakter olmalıdır");
            }

            var userId = GetCurrentUserId();
            var users = await _mediator.Send(new SearchUsersQuery(searchTerm, userId));
            return Ok(users);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}