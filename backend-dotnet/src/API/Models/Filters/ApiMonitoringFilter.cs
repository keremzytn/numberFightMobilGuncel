namespace API.Models.Filters
{
    public class ApiMonitoringFilter
    {
        public string? SearchQuery { get; set; }
        public string? Method { get; set; }
        public int? MinStatusCode { get; set; }
        public int? MaxStatusCode { get; set; }
        public long? MinResponseTime { get; set; }
        public long? MaxResponseTime { get; set; }
        public double? MinErrorRate { get; set; }
        public double? MaxErrorRate { get; set; }
        public long? MinRequests { get; set; }
        public string? SortBy { get; set; } = "TotalRequests";
        public bool SortDescending { get; set; } = true;
    }
}

