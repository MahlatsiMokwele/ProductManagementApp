namespace ProductCatalog.Api.Repositories;

// Provides reusable Npgsql plumbing - each concrete repository only has to define its stored-function calls and a row mapper, not connection management.
public abstract class RepositoryBase<TEntity, TKey> : IRepository<TEntity, TKey>
    where TEntity : class
{
    protected readonly string ConnectionString;

    protected RepositoryBase(IConfiguration configuration)
    {
        ConnectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Missing connection string 'Postgres'.");
    }

    // Implementation maps onto the specific stored functions in the DB
    public abstract Task<TEntity?> GetByIdAsync(TKey id);
    public abstract Task<IReadOnlyList<TEntity>> GetAllAsync();
    public abstract Task<TEntity> AddAsync(TEntity entity);
    public abstract Task<TEntity?> UpdateAsync(TEntity entity);
    public abstract Task<bool> DeleteAsync(TKey id);

    // Helpers used by concrete repos.
    protected async Task<List<T>> ExecuteFunctionListAsync<T>(
        string functionCall,
        Func<NpgsqlDataReader, T> mapper,
        params NpgsqlParameter[] parameters)
    {
        var results = new List<T>();
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(functionCall, conn);
        cmd.Parameters.AddRange(parameters);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(mapper(reader));
        }
        return results;
    }

    // Execute a function and return at most one row.
    protected async Task<T?> ExecuteFunctionSingleAsync<T>(
        string functionCall,
        Func<NpgsqlDataReader, T> mapper,
        params NpgsqlParameter[] parameters) where T : class
    {
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(functionCall, conn);
        cmd.Parameters.AddRange(parameters);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return mapper(reader);
        }
        return null;
    }

    //Execute a function that returns a scalar value
    protected async Task<TResult?> ExecuteScalarFunctionAsync<TResult>(
        string functionCall,
        params NpgsqlParameter[] parameters)
    {
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(functionCall, conn);
        cmd.Parameters.AddRange(parameters);

        var raw = await cmd.ExecuteScalarAsync();
        if (raw is null || raw is DBNull) return default;
        return (TResult)raw;
    }

    protected static NpgsqlParameter Param(string name, NpgsqlDbType type, object? value) =>
        new(name, type) { Value = value ?? DBNull.Value };
}
