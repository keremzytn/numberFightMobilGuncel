using Application.DTOs;

namespace Application.Features.Users.Commands.LoginUser;

public class LoginResponse
{
    public string Token { get; set; }
    public UserDto User { get; set; }
}
