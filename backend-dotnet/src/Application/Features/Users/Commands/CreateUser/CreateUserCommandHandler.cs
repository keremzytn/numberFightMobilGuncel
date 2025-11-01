using MediatR;
using AutoMapper;
using Core.Entities;
using Core.Interfaces;
using Application.DTOs;
using Application.Features.Users.Commands.LoginUser;

namespace Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public CreateUserCommandHandler(IUserRepository userRepository, IMapper mapper, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _mapper = mapper;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // E-posta ve kullanıcı adı kontrolü (trim ve lowercase)
        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim();

        var existingUserByEmail = await _userRepository.GetByEmailAsync(email);
        if (existingUserByEmail != null)
        {
            throw new InvalidOperationException("Bu e-posta adresi zaten kullanılıyor");
        }

        var existingUserByUsername = await _userRepository.GetByUsernameAsync(username);
        if (existingUserByUsername != null)
        {
            throw new InvalidOperationException("Bu kullanıcı adı zaten kullanılıyor");
        }

        // Şifre hash'leme işlemi
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(username, email, passwordHash);
        await _userRepository.AddAsync(user);

        return new LoginResponse
        {
            Token = _jwtTokenGenerator.GenerateToken(user),
            User = _mapper.Map<UserDto>(user)
        };
    }
}

