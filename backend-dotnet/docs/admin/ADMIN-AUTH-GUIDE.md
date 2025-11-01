# Admin Panel Authentication Kılavuzu

## Nasıl Çalışır?

Admin panel, **session tabanlı authentication** kullanıyor.

### Giriş Akışı

1. Kullanıcı `http://localhost:5227/` adresine gider
2. Otomatik olarak `/Admin/Login` sayfasına yönlendirilir
3. Kullanıcı adı ve şifre girer
4. Doğrulama başarılıysa:
   - Session'a `AdminAuthenticated = true` yazılır
   - Session'a `AdminUsername` kaydedilir
   - Dashboard'a yönlendirilir

### Sayfa Koruma

Tüm admin sayfaları `[AdminAuthorize]` attribute ile korunuyor:

```csharp
[AdminAuthorize]
public async Task<IActionResult> Dashboard()
{
    // Sadece giriş yapmış kullanıcılar erişebilir
}
```

### Session Ayarları

- **Süre**: 2 saat
- **Cookie İsmi**: `.NumberFight.AdminSession`
- **HttpOnly**: Aktif (XSS koruması)
- **IsEssential**: Aktif (GDPR izni gerektirmez)

## Dosya Yapısı

### 1. `appsettings.json`
```json
{
  "AdminSettings": {
    "Username": "admin",
    "Password": "Admin123!"
  }
}
```

### 2. `Program.cs`
```csharp
// Session servisi
builder.Services.AddSession(options => {
    options.IdleTimeout = TimeSpan.FromHours(2);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Session middleware
app.UseSession();
```

### 3. `AdminAuthorizationFilter.cs`
Custom authorization filter:
```csharp
public class AdminAuthorizationFilter : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var isAuthenticated = context.HttpContext.Session.GetString("AdminAuthenticated");
        if (isAuthenticated != "true")
        {
            context.Result = new RedirectToActionResult("Login", "Admin", null);
        }
    }
}
```

### 4. `AdminController.cs`
Login/Logout metodları:
```csharp
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
```

## Güvenlik İyileştirmeleri (Opsiyonel)

### 1. Hash'lenmiş Şifre
```csharp
using System.Security.Cryptography;
using System.Text;

public static string HashPassword(string password)
{
    using var sha256 = SHA256.Create();
    var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
    return Convert.ToBase64String(hashedBytes);
}
```

### 2. Brute Force Koruması
```csharp
private static Dictionary<string, int> _loginAttempts = new();

if (_loginAttempts.TryGetValue(username, out var attempts) && attempts >= 5)
{
    ViewBag.Error = "Çok fazla başarısız deneme. 15 dakika bekleyin.";
    return View();
}
```

### 3. Two-Factor Authentication
```csharp
// SMS veya Email ile 6 haneli kod gönder
var code = new Random().Next(100000, 999999).ToString();
HttpContext.Session.SetString("2FACode", code);
```

### 4. IP Kısıtlama
```csharp
var allowedIPs = new[] { "127.0.0.1", "192.168.1.100" };
var clientIP = HttpContext.Connection.RemoteIpAddress?.ToString();

if (!allowedIPs.Contains(clientIP))
{
    return Unauthorized("IP adresi engellendi");
}
```

## Production Deployment

### 1. Şifreyi Değiştir
```bash
cd backend-dotnet/src/API
nano appsettings.Production.json
```

```json
{
  "AdminSettings": {
    "Username": "super_admin",
    "Password": "VeryStr0ng!P@ssw0rd#2024"
  }
}
```

### 2. HTTPS Zorunluluğu
```csharp
app.UseHttpsRedirection(); // Zaten aktif
```

### 3. Secure Cookie
```csharp
builder.Services.AddSession(options => {
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Sadece HTTPS
    options.Cookie.SameSite = SameSiteMode.Strict; // CSRF koruması
});
```

### 4. Environment Variable Kullan
```bash
export ADMIN_USERNAME="super_admin"
export ADMIN_PASSWORD="VeryStr0ng!P@ssw0rd#2024"
```

```csharp
var adminUsername = Environment.GetEnvironmentVariable("ADMIN_USERNAME") 
                    ?? _configuration["AdminSettings:Username"];
```

## Test

```bash
cd backend-dotnet/src/API
dotnet run

# Tarayıcıda:
# http://localhost:5227/
# Kullanıcı: admin
# Şifre: Admin123!
```

## Sorun Giderme

### Session Çalışmıyor
- `app.UseSession()` middleware'inin `UseAuthentication()` ve `UseAuthorization()` **önce** çağrıldığından emin olun
- Browser cookies'lerini temizleyin

### Login Sonrası Yönlendirilmiyor
- `AdminAuthorizationFilter`'in doğru çalıştığından emin olun
- Session'ın yazıldığını kontrol edin: `HttpContext.Session.GetString("AdminAuthenticated")`

### 401 Unauthorized
- `[AdminAuthorize]` attribute'ünün tüm korumalı metodlarda olduğundan emin olun

