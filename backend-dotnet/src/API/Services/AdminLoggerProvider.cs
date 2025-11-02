using Microsoft.AspNetCore.SignalR;
using API.SignalR;
using System.Collections.Concurrent;

namespace API.Services;

public class AdminLoggerProvider : ILoggerProvider
{
    private readonly IHubContext<AdminHub>? _hubContext;
    private static readonly ConcurrentQueue<LogEntry> _allLogs = new(); // Tüm logları kalıcı tut
    private const int MaxBufferSize = 500; // Son 500 logu tut
    
    public AdminLoggerProvider(IServiceProvider serviceProvider)
    {
        // Service provider'dan hub context'i al (startup'ta henüz hazır olmayabilir)
        try
        {
            _hubContext = serviceProvider.GetService<IHubContext<AdminHub>>();
        }
        catch
        {
            _hubContext = null;
        }
    }

    public ILogger CreateLogger(string categoryName)
    {
        return new AdminLogger(categoryName, _hubContext, _allLogs);
    }

    // Yeni bağlanan admin'e tüm buffer'daki logları gönder
    public static async Task SendBufferedLogs(IHubContext<AdminHub> hubContext, string connectionId)
    {
        var logs = _allLogs.ToArray(); // Snapshot al
        foreach (var logEntry in logs)
        {
            try
            {
                // Sadece bu connection'a gönder
                await hubContext.Clients.Client(connectionId).SendAsync("ReceiveLog", new
                {
                    message = logEntry.Message,
                    level = logEntry.Level,
                    details = logEntry.Details,
                    timestamp = DateTime.UtcNow
                });
            }
            catch
            {
                // Hata olursa sessizce devam et
            }
        }
    }

    public void Dispose() { }
}

public class LogEntry
{
    public string Message { get; set; } = string.Empty;
    public string Level { get; set; } = "Info";
    public object? Details { get; set; }
}

public class AdminLogger : ILogger
{
    private readonly string _categoryName;
    private readonly IHubContext<AdminHub>? _hubContext;
    private readonly ConcurrentQueue<LogEntry> _bufferedLogs;

    public AdminLogger(string categoryName, IHubContext<AdminHub>? hubContext, ConcurrentQueue<LogEntry> bufferedLogs)
    {
        _categoryName = categoryName;
        _hubContext = hubContext;
        _bufferedLogs = bufferedLogs;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Debug; // Debug seviyesini de göster

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel))
            return;

        // Bazı gürültülü logları filtrele
        var category = _categoryName.Split('.').LastOrDefault() ?? _categoryName;
        var message = formatter(state, exception);
        
        if (ShouldIgnoreLog(category, message))
            return;

        if (exception != null)
            message = $"{message}\n{exception}";

        var level = logLevel switch
        {
            LogLevel.Critical => "Error",
            LogLevel.Error => "Error",
            LogLevel.Warning => "Warning",
            LogLevel.Information => "Info",
            LogLevel.Debug => "Debug",
            _ => "Info"
        };

        var details = new { category, eventId = eventId.Id };
        var logEntry = new LogEntry { Message = message, Level = level, Details = details };

        // Her zaman buffer'a ekle (yeni bağlananlara göndermek için)
        _bufferedLogs.Enqueue(logEntry);
        
        // Buffer çok büyürse eski logları at (son 500 logu tut)
        while (_bufferedLogs.Count > 500)
        {
            _bufferedLogs.TryDequeue(out _);
        }

        // HubContext varsa ayrıca real-time gönder (fire and forget)
        if (_hubContext != null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await AdminHub.BroadcastLog(_hubContext, message, level, details);
                }
                catch
                {
                    // Hata olursa sessizce yok say
                }
            });
        }
    }

    private static bool ShouldIgnoreLog(string category, string message)
    {
        // Entity Framework query loglarını FİLTRELE (çok fazla!)
        // Sadece uzun süren sorguları veya önemli olanları göster
        if (category == "Command" && message.StartsWith("Executed DbCommand"))
        {
            // 10ms'den uzun süren sorguları göster
            if (message.Contains("(") && message.Contains("ms)"))
            {
                var msText = message.Substring(message.IndexOf("(") + 1, message.IndexOf("ms)") - message.IndexOf("(") - 1);
                if (int.TryParse(msText, out int ms) && ms < 10)
                {
                    return true; // Hızlı sorguları gösterme
                }
            }
        }

        // StaticFileMiddleware uyarılarını filtrele
        if (category == "StaticFileMiddleware" && message.Contains("WebRootPath was not found"))
            return true;

        // HttpsRedirection uyarılarını filtrele
        if (message.Contains("Failed to determine the https port"))
            return true;

        // Model validation uyarılarını filtrele (startup'ta bir kere çıkar)
        if (message.Contains("value converter but with no value comparer"))
            return true;

        return false;
    }
}

