using MediatR;
using AutoMapper;
using Core.Entities;
using Core.Interfaces;
using Application.DTOs;

namespace Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public CreateUserCommandHandler(IUserRepository userRepository, IMapper mapper)
    {
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<UserDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // Burada şifre hash'leme işlemi yapılacak
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(request.Username, request.Email, passwordHash);
        await _userRepository.AddAsync(user);

        return _mapper.Map<UserDto>(user);
    }
}

