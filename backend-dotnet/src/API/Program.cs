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
builder.WebHost.UseUrls("http://*:5227");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
app.UseRouting();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gameHub");

app.Run();