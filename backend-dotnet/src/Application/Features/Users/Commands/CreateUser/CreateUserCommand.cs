using MediatR;
using Application.DTOs;
using Application.Features.Users.Commands.LoginUser;

namespace Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(string Username, string Email, string Password) : IRequest<LoginResponse>;

