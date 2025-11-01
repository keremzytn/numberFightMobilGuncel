using Microsoft.EntityFrameworkCore;
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users.ToListAsync();
    }

    public async Task<User> AddAsync(User user)
    {
        try
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }
        catch (DbUpdateException ex)
        {
            // Unique constraint hatası
            if (ex.InnerException?.Message.Contains("IX_Users_Email") == true)
            {
                throw new InvalidOperationException("Bu e-posta adresi zaten kullanılıyor");
            }
            if (ex.InnerException?.Message.Contains("IX_Users_Username") == true)
            {
                throw new InvalidOperationException("Bu kullanıcı adı zaten kullanılıyor");
            }
            throw;
        }
    }

    public async Task UpdateAsync(User user)
    {
        _context.Entry(user).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(string id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }
}

