using MediatR;
using AutoMapper;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Users.Commands.LoginUser;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginUserCommandHandler(
        IUserRepository userRepository,
        IMapper mapper,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _mapper = mapper;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
            throw new KeyNotFoundException("Kullanıcı bulunamadı");

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
            throw new UnauthorizedAccessException("Geçersiz şifre");

        // Ban kontrolü
        if (user.IsCurrentlyBanned())
        {
            var banMessage = user.BannedUntil.HasValue
                ? $"Hesabınız {user.BannedUntil.Value:dd.MM.yyyy HH:mm} tarihine kadar banlandı. Sebep: {user.BanReason}"
                : $"Hesabınız kalıcı olarak banlandı. Sebep: {user.BanReason}";
            throw new UnauthorizedAccessException(banMessage);
        }

        // Online durumu güncelle
        user.SetOnlineStatus(true);
        await _userRepository.UpdateAsync(user);

        return new LoginResponse
        {
            Token = _jwtTokenGenerator.GenerateToken(user),
            User = _mapper.Map<UserDto>(user)
        };
    }
}
