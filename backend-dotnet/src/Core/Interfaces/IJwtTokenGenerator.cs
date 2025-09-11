using Core.Entities;

namespace Core.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
