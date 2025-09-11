using MediatR;
using Application.DTOs;

namespace Application.Features.Users.Queries.GetUserById;

public record GetUserByIdQuery(string Id) : IRequest<UserDto>;

