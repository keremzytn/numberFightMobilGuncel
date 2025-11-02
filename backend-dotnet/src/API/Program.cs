using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using FluentValidation.AspNetCore;
using Application.Mappings;
using Application.Validators;
using Infrastructure;
using API.SignalR;
using API.Services;
using API.Middleware;
using API.BackgroundServices;
using Core.Interfaces;
using Core.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to listen on all IP addresses
// Railway, Render gibi platformlar PORT environment variable kullanır
var port = Environment.GetEnvironmentVariable("PORT") ?? "5227";
builder.WebHost.UseUrls($"http://*:{port}");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddControllersWithViews(); // MVC Views için
builder.Services.AddRazorPages(); // Razor Pages için
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Session for Admin Authentication
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(2);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.Name = ".NumberFight.AdminSession";
});

// Add Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// Add AutoMapper
builder.Services.AddAutoMapper(config =>
{
    config.AddProfile<MappingProfile>();
});

// Add MediatR
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Application.Features.Users.Commands.CreateUser.CreateUserCommand).Assembly);
});

// Add FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateUserCommandValidator>();

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)
            )
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/gameHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Add JWT Token Generator
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// Add Game Services
builder.Services.AddScoped<GameStatsService>();
builder.Services.AddSingleton<BotPlayer>();

// Add SignalR
builder.Services.AddSignalR();

// Add Background Services
builder.Services.AddHostedService<GameTimeoutService>();
builder.Services.AddHostedService<AdminStatsBackgroundService>();

// Add Custom Logger Provider for Admin Panel
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Debug); // Debug loglarını da göster
// Admin logger provider'ı app build edildikten sonra ekleyeceğiz

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyHeader()
               .AllowAnyMethod()
               .SetIsOriginAllowed((host) => true)
               .AllowCredentials();
    });
});

var app = builder.Build();

// Add Admin Logger Provider (app build edildikten sonra)
var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
loggerFactory.AddProvider(new AdminLoggerProvider(app.Services));

// 🧹 Startup'ta tüm aktif oyunları temizle
using (var scope = app.Services.CreateScope())
{
    var gameRepository = scope.ServiceProvider.GetRequiredService<IGameRepository>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var activeGames = await gameRepository.GetActiveGamesAsync();
        var gameList = activeGames.ToList();
        if (gameList.Any())
        {
            logger.LogWarning($"🧹 Startup: {gameList.Count} aktif oyun temizleniyor...");
            foreach (var game in gameList)
            {
                game.EndGameWithWinner(game.Player1Score > game.Player2Score ? game.Player1Id :
                                       game.Player2Score > game.Player1Score ? game.Player2Id :
                                       game.Player1Id);
                await gameRepository.UpdateAsync(game);
            }
            logger.LogInformation("✅ Tüm aktif oyunlar temizlendi");
        }
        else
        {
            logger.LogInformation("✅ Temizlenecek aktif oyun yok");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Oyun temizleme sırasında hata oluştu");
    }
}

// ✅ NGROK UYARI SAYFASINI KALDIRAN MIDDLEWARE
app.Use(async (context, next) =>
{
    context.Response.Headers["ngrok-skip-browser-warning"] = "true";
    await next();
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandling();
app.UseHttpsRedirection();
app.UseStaticFiles(); // Static files için (CSS, JS)
app.UseRouting();
app.UseCors("AllowAll");
app.UseSession(); // Session middleware
app.UseMiddleware<API.Middleware.ApiMonitoringMiddleware>(); // API Monitoring

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gameHub");
app.MapHub<AdminHub>("/adminHub");
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Admin}/{action=Dashboard}/{id?}"); // Admin panel default route

app.Run();