using ProductCatalog.Api.Entities;

namespace ProductCatalog.Api.Repositories;

public interface IUserRepository : IRepository<User, Guid>
{
    Task<User?> GetByUsernameAsync(string username);
}

public class UserRepository : RepositoryBase<User, Guid>, IUserRepository
{
    public UserRepository(IConfiguration configuration) : base(configuration) { }

    private static User MapUser(NpgsqlDataReader r) => new()
    {
        Id           = r.GetGuid(r.GetOrdinal("id")),
        Username     = r.GetString(r.GetOrdinal("username")),
        Name         = r.GetString(r.GetOrdinal("name")),
        Surname      = r.GetString(r.GetOrdinal("surname")),
        Role         = r.GetString(r.GetOrdinal("role")),
        PasswordHash = r.GetString(r.GetOrdinal("password_hash")),
        AuditUserId  = r.GetGuid(r.GetOrdinal("audit_user_id")),
        CreatedAt    = r.GetDateTime(r.GetOrdinal("created_at"))
    };

    public override Task<User?> GetByIdAsync(Guid id) =>
        throw new NotSupportedException("Lookup users by username instead.");

    public override Task<IReadOnlyList<User>> GetAllAsync() =>
        throw new NotSupportedException("Listing users isn't in scope.");

    public async Task<User?> GetByUsernameAsync(string username) =>
        await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_get_user_by_username(@p_username)",
            MapUser,
            Param("p_username", NpgsqlDbType.Varchar, username));

    public override async Task<User> AddAsync(User entity)
    {
        var inserted = await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_insert_user(@p_username, @p_name, @p_surname, @p_role, @p_password_hash, @p_audit_user_id)",
            MapUser,
            Param("p_username",      NpgsqlDbType.Varchar, entity.Username),
            Param("p_name",          NpgsqlDbType.Varchar, entity.Name),
            Param("p_surname",       NpgsqlDbType.Varchar, entity.Surname),
            Param("p_role",          NpgsqlDbType.Varchar, entity.Role),
            Param("p_password_hash", NpgsqlDbType.Varchar, entity.PasswordHash),
            Param("p_audit_user_id", NpgsqlDbType.Uuid,    entity.AuditUserId));
        return inserted ?? throw new InvalidOperationException("Insert did not return a row.");
    }

    public override Task<User?> UpdateAsync(User entity) =>
        throw new NotSupportedException("User update isn't implemented.");

    public override Task<bool> DeleteAsync(Guid id) =>
        throw new NotSupportedException("User delete isn't implemented.");
}
