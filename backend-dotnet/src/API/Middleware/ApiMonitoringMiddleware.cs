using System.Diagnostics;

namespace API.Middleware;

public class ApiMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiMonitoringMiddleware> _logger;

    public ApiMonitoringMiddleware(RequestDelegate next, ILogger<ApiMonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Admin sayfalarını ve static dosyaları izleme
        var path = context.Request.Path.Value?.ToLower();
        if (path != null && (path.StartsWith("/admin") || path.Contains("/swagger") || path.Contains(".")))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var endpoint = $"{context.Request.Method} {context.Request.Path}";

        try
        {
            await _next(context);
            stopwatch.Stop();

            // İstatistikleri kaydet
            ApiMonitoringService.RecordRequest(
                endpoint: endpoint,
                method: context.Request.Method,
                statusCode: context.Response.StatusCode,
                responseTimeMs: stopwatch.ElapsedMilliseconds,
                isError: context.Response.StatusCode >= 400
            );
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            // Hata durumunu kaydet
            ApiMonitoringService.RecordRequest(
                endpoint: endpoint,
                method: context.Request.Method,
                statusCode: 500,
                responseTimeMs: stopwatch.ElapsedMilliseconds,
                isError: true
            );

            _logger.LogError(ex, "API request error: {Endpoint}", endpoint);
            throw;
        }
    }
}

public static class ApiMonitoringService
{
    private static readonly object _lock = new object();
    private static readonly Dictionary<string, ApiEndpointStats> _stats = new();
    private static readonly List<ApiRequestLog> _recentRequests = new();
    private static readonly int _maxRecentRequests = 100;

    public static void RecordRequest(string endpoint, string method, int statusCode, long responseTimeMs, bool isError)
    {
        lock (_lock)
        {
            // Endpoint istatistikleri
            if (!_stats.ContainsKey(endpoint))
            {
                _stats[endpoint] = new ApiEndpointStats
                {
                    Endpoint = endpoint,
                    Method = method
                };
            }

            var stats = _stats[endpoint];
            stats.TotalRequests++;
            stats.TotalResponseTimeMs += responseTimeMs;
            stats.LastRequestAt = DateTime.UtcNow;

            if (responseTimeMs > stats.MaxResponseTimeMs)
                stats.MaxResponseTimeMs = responseTimeMs;

            if (stats.MinResponseTimeMs == 0 || responseTimeMs < stats.MinResponseTimeMs)
                stats.MinResponseTimeMs = responseTimeMs;

            if (isError)
                stats.ErrorCount++;

            // Status code dağılımı
            if (!stats.StatusCodeDistribution.ContainsKey(statusCode))
                stats.StatusCodeDistribution[statusCode] = 0;
            stats.StatusCodeDistribution[statusCode]++;

            // Son istekler
            _recentRequests.Insert(0, new ApiRequestLog
            {
                Endpoint = endpoint,
                Method = method,
                StatusCode = statusCode,
                ResponseTimeMs = responseTimeMs,
                Timestamp = DateTime.UtcNow,
                IsError = isError
            });

            // Max limit aşarsa eski istekleri sil
            if (_recentRequests.Count > _maxRecentRequests)
            {
                _recentRequests.RemoveAt(_recentRequests.Count - 1);
            }
        }
    }

    public static ApiMonitoringData GetStats()
    {
        lock (_lock)
        {
            return new ApiMonitoringData
            {
                EndpointStats = _stats.Values.OrderByDescending(s => s.TotalRequests).ToList(),
                RecentRequests = _recentRequests.Take(50).ToList(),
                TotalRequests = _stats.Values.Sum(s => s.TotalRequests),
                TotalErrors = _stats.Values.Sum(s => s.ErrorCount),
                AverageResponseTime = _stats.Values.Any()
                    ? (long)_stats.Values.Average(s => s.AverageResponseTimeMs)
                    : 0
            };
        }
    }

    public static void Reset()
    {
        lock (_lock)
        {
            _stats.Clear();
            _recentRequests.Clear();
        }
    }
}

public class ApiEndpointStats
{
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public long TotalRequests { get; set; }
    public long ErrorCount { get; set; }
    public long TotalResponseTimeMs { get; set; }
    public long MinResponseTimeMs { get; set; }
    public long MaxResponseTimeMs { get; set; }
    public DateTime? LastRequestAt { get; set; }
    public Dictionary<int, long> StatusCodeDistribution { get; set; } = new();

    public long AverageResponseTimeMs => TotalRequests > 0 ? TotalResponseTimeMs / TotalRequests : 0;
    public double ErrorRate => TotalRequests > 0 ? (ErrorCount * 100.0 / TotalRequests) : 0;
    public double SuccessRate => 100 - ErrorRate;
}

public class ApiRequestLog
{
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public long ResponseTimeMs { get; set; }
    public DateTime Timestamp { get; set; }
    public bool IsError { get; set; }
}

public class ApiMonitoringData
{
    public List<ApiEndpointStats> EndpointStats { get; set; } = new();
    public List<ApiRequestLog> RecentRequests { get; set; } = new();
    public long TotalRequests { get; set; }
    public long TotalErrors { get; set; }
    public long AverageResponseTime { get; set; }
    public double ErrorRate => TotalRequests > 0 ? (TotalErrors * 100.0 / TotalRequests) : 0;
}

