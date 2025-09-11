using MediatR;
using Application.DTOs;

namespace Application.Features.Friends.Queries.SearchUsers;

public record SearchUsersQuery(string SearchTerm, string CurrentUserId) : IRequest<List<UserDto>>;