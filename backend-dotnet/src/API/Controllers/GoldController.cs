using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GoldController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<GoldController> _logger;

    public GoldController(IUserRepository userRepository, ILogger<GoldController> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet("balance")]
    public async Task<ActionResult<int>> GetBalance()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return NotFound("Kullanıcı bulunamadı");

            return Ok(new { gold = user.Gold });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gold harcanırken hata oluştu");
            return StatusCode(500, "Sunucu hatası");
        }
    }
}

public record AddGoldRequest(int Amount);
public record SpendGoldRequest(int Amount);

