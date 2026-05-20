namespace ProductCatalog.Api.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.Employee;
    public string PasswordHash { get; set; } = string.Empty;
    public Guid AuditUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Canonical role string constants. Avoid string-typos.
public static class UserRoles
{
    public const string Admin = "admin";
    public const string Employee = "employee";

    public static bool IsValid(string? role) => role is Admin or Employee;
}
