namespace ProductCatalog.Api.Dtos;

// Body for POST /api/auth/login
public record LoginRequest(string Username, string Password);

// Body for POST /api/auth/register
public record RegisterRequest(
    string Username,
    string Password,
    string Name,
    string Surname,
    string Role
);

// Response after a successful login or register
public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string Username,
    string Role
);
