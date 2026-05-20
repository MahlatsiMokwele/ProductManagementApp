using ProductCatalog.Api.Auth;
using ProductCatalog.Api.Dtos;
using ProductCatalog.Api.Entities;
using ProductCatalog.Api.Repositories;
using ProductCatalog.Api.Validation;

namespace ProductCatalog.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly IJwtTokenService _jwt;

    public AuthController(IUserRepository users, IJwtTokenService jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var validation = AuthValidator.Validate(request);
        if (!validation.IsValid) return BadRequest(new { error = validation.Error });

        var existing = await _users.GetByUsernameAsync(request.Username);
        if (existing is not null)
        {
            return Conflict(new { error = "Username already exists." });
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 11);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Name = request.Name,
            Surname = request.Surname,
            Role = request.Role,
            PasswordHash = hash,
            AuditUserId = Guid.Empty
        };

        var created = await _users.AddAsync(user);
        var (token, expires) = _jwt.CreateToken(created);
        return Ok(new AuthResponse(token, expires, created.Username, created.Role));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var validation = AuthValidator.Validate(request);
        if (!validation.IsValid) return BadRequest(new { error = validation.Error });

        var user = await _users.GetByUsernameAsync(request.Username);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Invalid credentials." });
        }

        var (token, expires) = _jwt.CreateToken(user);
        return Ok(new AuthResponse(token, expires, user.Username, user.Role));
    }
}
