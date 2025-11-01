using Microsoft.AspNetCore.Mvc;
using Core.Interfaces;
using Core.Services;
using API.Filters;

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
    public async Task<IActionResult> Users()
    {
        var users = await _userRepository.GetAllAsync();
        return View(users.OrderByDescending(u => u.CreatedAt));
    }

    [AdminAuthorize]
    public async Task<IActionResult> Games()
    {
        var games = await _gameRepository.GetAllGamesAsync();
        return View(games.OrderByDescending(g => g.CreatedAt).Take(100));
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

