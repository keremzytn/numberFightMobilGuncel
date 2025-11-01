using Microsoft.AspNetCore.Mvc;
using Core.Interfaces;
using Core.Services;
using API.Filters;
using API.Models.Filters;

namespace API.Controllers;

public class AdminController : Controller
{
    private readonly IUserRepository _userRepository;
    private readonly IGameRepository _gameRepository;
    private readonly IFriendRepository _friendRepository;
    private readonly IMatchRepository _matchRepository;
    private readonly GameStatsService _statsService;
    private readonly IConfiguration _configuration;

    public AdminController(
        IUserRepository userRepository,
        IGameRepository gameRepository,
        IFriendRepository friendRepository,
        IMatchRepository matchRepository,
        GameStatsService statsService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _gameRepository = gameRepository;
        _friendRepository = friendRepository;
        _matchRepository = matchRepository;
        _statsService = statsService;
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Login()
    {
        // Zaten giriş yapmışsa dashboard'a yönlendir
        if (HttpContext.Session.GetString("AdminAuthenticated") == "true")
        {
            return RedirectToAction("Dashboard");
        }
        return View();
    }

    [HttpPost]
    public IActionResult Login(string username, string password)
    {
        var adminUsername = _configuration["AdminSettings:Username"];
        var adminPassword = _configuration["AdminSettings:Password"];

        if (username == adminUsername && password == adminPassword)
        {
            HttpContext.Session.SetString("AdminAuthenticated", "true");
            HttpContext.Session.SetString("AdminUsername", username);
            return RedirectToAction("Dashboard");
        }

        ViewBag.Error = "Kullanıcı adı veya şifre hatalı!";
        return View();
    }

    [HttpPost]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Login");
    }

    [AdminAuthorize]
    public async Task<IActionResult> Dashboard()
    {
        var allUsers = await _userRepository.GetAllAsync();
        var activeGames = await _gameRepository.GetActiveGamesAsync();
        var allGames = await _gameRepository.GetAllGamesAsync();

        var usersList = allUsers.ToList();
        var gamesList = allGames.ToList();

        // Son 7 günün oyun istatistikleri
        var last7Days = Enumerable.Range(0, 7)
            .Select(i => DateTime.UtcNow.AddDays(-i).Date)
            .Reverse()
            .ToList();

        var gamesPerDay = last7Days.Select(date => new
        {
            Date = date,
            Count = gamesList.Count(g => g.CreatedAt.Date == date)
        }).ToList();

        var viewModel = new DashboardViewModel
        {
            TotalUsers = usersList.Count,
            ActiveGames = activeGames.Count(),
            CompletedGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Completed),
            TotalGames = gamesList.Count,
            OnlineUsers = usersList.Count(u => u.IsOnline),
            OfflineUsers = usersList.Count(u => !u.IsOnline),
            BannedUsers = usersList.Count(u => u.IsBanned),

            // Grafik verileri
            Last7DaysLabels = last7Days.Select(d => d.ToString("dd MMM")).ToList(),
            Last7DaysGameCounts = gamesPerDay.Select(g => g.Count).ToList(),

            // Oyun durum dağılımı
            WaitingGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Waiting),
            InProgressGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.InProgress),
            CompletedGamesCount = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Completed),
            CancelledGames = gamesList.Count(g => g.Status == Core.Entities.GameStatus.Cancelled)
        };

        return View(viewModel);
    }

    [AdminAuthorize]
    public async Task<IActionResult> Users([FromQuery] UserFilter filter)
    {
        var users = await _userRepository.GetAllAsync();
        var query = users.AsQueryable();

        // Arama
        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            var searchLower = filter.SearchQuery.ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.Id.ToLower().Contains(searchLower));
        }

        // Online/Offline filtresi
        if (filter.IsOnline.HasValue)
        {
            query = query.Where(u => u.IsOnline == filter.IsOnline.Value);
        }

        // Ban filtresi
        if (filter.IsBanned.HasValue)
        {
            query = query.Where(u => u.IsBanned == filter.IsBanned.Value);
        }

        // Tarih filtreleri
        if (filter.RegisteredAfter.HasValue)
        {
            query = query.Where(u => u.CreatedAt >= filter.RegisteredAfter.Value);
        }

        if (filter.RegisteredBefore.HasValue)
        {
            query = query.Where(u => u.CreatedAt <= filter.RegisteredBefore.Value);
        }

        // Gold filtreleri
        if (filter.MinGold.HasValue)
        {
            query = query.Where(u => u.Gold >= filter.MinGold.Value);
        }

        if (filter.MaxGold.HasValue)
        {
            query = query.Where(u => u.Gold <= filter.MaxGold.Value);
        }

        // Sıralama
        query = filter.SortBy?.ToLower() switch
        {
            "username" => filter.SortDescending ? query.OrderByDescending(u => u.Username) : query.OrderBy(u => u.Username),
            "gold" => filter.SortDescending ? query.OrderByDescending(u => u.Gold) : query.OrderBy(u => u.Gold),
            "lastseenat" => filter.SortDescending ? query.OrderByDescending(u => u.LastSeenAt) : query.OrderBy(u => u.LastSeenAt),
            _ => filter.SortDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
        };

        ViewBag.Filter = filter;
        return View(query.ToList());
    }

    [AdminAuthorize]
    public async Task<IActionResult> Games([FromQuery] GameFilter filter)
    {
        var games = await _gameRepository.GetAllGamesAsync();
        var query = games.AsQueryable();

        // Oyuncu filtresi
        if (!string.IsNullOrWhiteSpace(filter.PlayerId))
        {
            query = query.Where(g => g.Player1Id == filter.PlayerId || g.Player2Id == filter.PlayerId);
        }

        // Durum filtresi
        if (filter.Status.HasValue)
        {
            query = query.Where(g => g.Status == filter.Status.Value);
        }

        // Tarih filtreleri
        if (filter.StartDate.HasValue)
        {
            query = query.Where(g => g.CreatedAt >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            query = query.Where(g => g.CreatedAt <= filter.EndDate.Value);
        }

        // Kazanan filtresi
        if (!string.IsNullOrWhiteSpace(filter.WinnerId))
        {
            query = query.Where(g => g.WinnerId == filter.WinnerId);
        }

        // Minimum skor filtresi
        if (filter.MinScore.HasValue)
        {
            query = query.Where(g => g.Player1Score >= filter.MinScore.Value || g.Player2Score >= filter.MinScore.Value);
        }

        // Sıralama
        query = filter.SortBy?.ToLower() switch
        {
            "status" => filter.SortDescending ? query.OrderByDescending(g => g.Status) : query.OrderBy(g => g.Status),
            _ => filter.SortDescending ? query.OrderByDescending(g => g.CreatedAt) : query.OrderBy(g => g.CreatedAt)
        };

        ViewBag.Filter = filter;
        return View(query.Take(100).ToList());
    }

    [AdminAuthorize]
    public async Task<IActionResult> ActiveGames()
    {
        var games = await _gameRepository.GetActiveGamesAsync();
        return View(games.OrderByDescending(g => g.CreatedAt));
    }

    [AdminAuthorize]
    public async Task<IActionResult> Friends()
    {
        var friends = await _friendRepository.GetAllFriendshipsAsync();
        return View(friends.OrderByDescending(f => f.CreatedAt).Take(100));
    }

    [AdminAuthorize]
    public IActionResult ApiMonitoring([FromQuery] ApiMonitoringFilter filter)
    {
        var stats = API.Middleware.ApiMonitoringService.GetStats();

        // Filtreleme
        var filteredStats = stats.EndpointStats.AsEnumerable();

        // Search
        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            filteredStats = filteredStats.Where(s =>
                s.Endpoint.Contains(filter.SearchQuery, StringComparison.OrdinalIgnoreCase));
        }

        // Method
        if (!string.IsNullOrWhiteSpace(filter.Method))
        {
            filteredStats = filteredStats.Where(s =>
                s.Method.Equals(filter.Method, StringComparison.OrdinalIgnoreCase));
        }

        // Response Time
        if (filter.MinResponseTime.HasValue)
        {
            filteredStats = filteredStats.Where(s => s.AverageResponseTimeMs >= filter.MinResponseTime.Value);
        }
        if (filter.MaxResponseTime.HasValue)
        {
            filteredStats = filteredStats.Where(s => s.AverageResponseTimeMs <= filter.MaxResponseTime.Value);
        }

        // Error Rate
        if (filter.MinErrorRate.HasValue)
        {
            filteredStats = filteredStats.Where(s => s.ErrorRate >= filter.MinErrorRate.Value);
        }
        if (filter.MaxErrorRate.HasValue)
        {
            filteredStats = filteredStats.Where(s => s.ErrorRate <= filter.MaxErrorRate.Value);
        }

        // Min Requests
        if (filter.MinRequests.HasValue)
        {
            filteredStats = filteredStats.Where(s => s.TotalRequests >= filter.MinRequests.Value);
        }

        // Sorting
        filteredStats = filter.SortBy?.ToLower() switch
        {
            "endpoint" => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.Endpoint)
                : filteredStats.OrderBy(s => s.Endpoint),
            "method" => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.Method)
                : filteredStats.OrderBy(s => s.Method),
            "totalrequests" => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.TotalRequests)
                : filteredStats.OrderBy(s => s.TotalRequests),
            "averageresponsetime" => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.AverageResponseTimeMs)
                : filteredStats.OrderBy(s => s.AverageResponseTimeMs),
            "errorrate" => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.ErrorRate)
                : filteredStats.OrderBy(s => s.ErrorRate),
            "lastrequest" => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.LastRequestAt)
                : filteredStats.OrderBy(s => s.LastRequestAt),
            _ => filter.SortDescending
                ? filteredStats.OrderByDescending(s => s.TotalRequests)
                : filteredStats.OrderBy(s => s.TotalRequests)
        };

        stats.EndpointStats = filteredStats.ToList();
        ViewBag.Filter = filter;

        return View(stats);
    }

    [HttpPost]
    [AdminAuthorize]
    public IActionResult ResetApiStats()
    {
        API.Middleware.ApiMonitoringService.Reset();
        TempData["Success"] = "API istatistikleri sıfırlandı!";
        return RedirectToAction("ApiMonitoring");
    }

    [AdminAuthorize]
    public async Task<IActionResult> UserDetail(string id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        var games = await _gameRepository.GetUserGamesAsync(id);
        var stats = await _statsService.GetUserStats(id);

        var viewModel = new UserDetailViewModel
        {
            User = user,
            Games = games.ToList(),
            Stats = new Application.DTOs.UserStatsDto
            {
                TotalGames = stats.TotalGames,
                Wins = stats.WonGames,
                Losses = stats.LostGames,
                Draws = stats.DrawGames,
                WinRate = stats.WinRate
            }
        };

        return View(viewModel);
    }

    [AdminAuthorize]
    public async Task<IActionResult> GameDetail(string id)
    {
        var game = await _gameRepository.GetByIdAsync(id);
        if (game == null)
            return NotFound();

        return View(game);
    }

    // User Management Actions
    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> AddGold(string userId, int amount)
    {
        if (amount <= 0 || amount > 10000)
        {
            TempData["Error"] = "Geçersiz gold miktarı (1-10000 arası olmalı)";
            return RedirectToAction("UserDetail", new { id = userId });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound();

        user.AddGold(amount);
        await _userRepository.UpdateAsync(user);

        TempData["Success"] = $"{amount} gold başarıyla eklendi!";
        return RedirectToAction("UserDetail", new { id = userId });
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> RemoveGold(string userId, int amount)
    {
        if (amount <= 0 || amount > 10000)
        {
            TempData["Error"] = "Geçersiz gold miktarı (1-10000 arası olmalı)";
            return RedirectToAction("UserDetail", new { id = userId });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound();

        try
        {
            user.RemoveGold(amount);
            await _userRepository.UpdateAsync(user);
            TempData["Success"] = $"{amount} gold başarıyla çıkarıldı!";
        }
        catch (InvalidOperationException ex)
        {
            TempData["Error"] = ex.Message;
        }

        return RedirectToAction("UserDetail", new { id = userId });
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> BanUser(string userId, string reason, int? durationDays)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound();

        DateTime? bannedUntil = durationDays.HasValue
            ? DateTime.UtcNow.AddDays(durationDays.Value)
            : null;

        user.Ban(reason ?? "Admin tarafından banlandı", bannedUntil);
        await _userRepository.UpdateAsync(user);

        var banType = bannedUntil.HasValue ? $"{durationDays} gün süreyle" : "kalıcı olarak";
        TempData["Success"] = $"Kullanıcı {banType} banlandı!";
        return RedirectToAction("UserDetail", new { id = userId });
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> UnbanUser(string userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound();

        user.Unban();
        await _userRepository.UpdateAsync(user);

        TempData["Success"] = "Kullanıcının banı kaldırıldı!";
        return RedirectToAction("UserDetail", new { id = userId });
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> BulkAction(string action, List<string> userIds, int? amount, string? reason)
    {
        if (userIds == null || !userIds.Any())
        {
            TempData["Error"] = "Hiç kullanıcı seçilmedi!";
            return RedirectToAction("Users");
        }

        int successCount = 0;
        int failCount = 0;

        foreach (var userId in userIds)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    failCount++;
                    continue;
                }

                switch (action?.ToLower())
                {
                    case "addgold":
                        if (amount.HasValue && amount.Value > 0)
                        {
                            user.AddGold(amount.Value);
                            await _userRepository.UpdateAsync(user);
                            successCount++;
                        }
                        break;

                    case "removegold":
                        if (amount.HasValue && amount.Value > 0)
                        {
                            user.RemoveGold(amount.Value);
                            await _userRepository.UpdateAsync(user);
                            successCount++;
                        }
                        break;

                    case "ban":
                        if (!string.IsNullOrWhiteSpace(reason))
                        {
                            user.Ban(reason, null);
                            await _userRepository.UpdateAsync(user);
                            successCount++;
                        }
                        break;

                    case "unban":
                        user.Unban();
                        await _userRepository.UpdateAsync(user);
                        successCount++;
                        break;

                    default:
                        failCount++;
                        break;
                }
            }
            catch (Exception)
            {
                failCount++;
            }
        }

        if (successCount > 0)
        {
            TempData["Success"] = $"İşlem başarılı! {successCount} kullanıcı güncellendi.";
        }

        if (failCount > 0)
        {
            TempData["Warning"] = $"{failCount} kullanıcı için işlem başarısız oldu.";
        }

        return RedirectToAction("Users");
    }
}

public class DashboardViewModel
{
    public int TotalUsers { get; set; }
    public int ActiveGames { get; set; }
    public int CompletedGames { get; set; }
    public int TotalGames { get; set; }
    public int OnlineUsers { get; set; }
    public int OfflineUsers { get; set; }
    public int BannedUsers { get; set; }

    // Grafik verileri
    public List<string> Last7DaysLabels { get; set; } = new();
    public List<int> Last7DaysGameCounts { get; set; } = new();

    // Oyun durum dağılımı
    public int WaitingGames { get; set; }
    public int InProgressGames { get; set; }
    public int CompletedGamesCount { get; set; }
    public int CancelledGames { get; set; }
}

public class UserDetailViewModel
{
    public Core.Entities.User User { get; set; } = null!;
    public List<Core.Entities.Game> Games { get; set; } = new();
    public Application.DTOs.UserStatsDto? Stats { get; set; }
}

