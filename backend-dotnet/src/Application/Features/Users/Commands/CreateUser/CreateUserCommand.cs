using MediatR;
using Application.DTOs;

namespace Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(string Username, string Email, string Password) : IRequest<UserDto>;

