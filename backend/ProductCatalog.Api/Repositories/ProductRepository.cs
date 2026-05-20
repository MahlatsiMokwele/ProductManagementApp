using ProductCatalog.Api.Entities;

namespace ProductCatalog.Api.Repositories;

public interface IProductRepository : IRepository<Product, Guid>
{
    // Paged + filtered product list
    Task<(IReadOnlyList<Product> Items, long TotalCount)> GetPagedAsync(
        int page, int pageSize, Guid? categoryId, string? search);
}

public class ProductRepository : RepositoryBase<Product, Guid>, IProductRepository
{
    public ProductRepository(IConfiguration configuration) : base(configuration) { }

    private static Product MapProduct(NpgsqlDataReader r) => new()
    {
        Id          = r.GetGuid(r.GetOrdinal("id")),
        Name        = r.GetString(r.GetOrdinal("name")),
        Description = r.IsDBNull(r.GetOrdinal("description")) ? null : r.GetString(r.GetOrdinal("description")),
        Sku         = r.GetString(r.GetOrdinal("sku")),
        Price       = r.GetDecimal(r.GetOrdinal("price")),
        Quantity    = r.GetInt32(r.GetOrdinal("quantity")),
        CategoryId  = r.IsDBNull(r.GetOrdinal("category_id")) ? null : r.GetGuid(r.GetOrdinal("category_id")),
        CreatedAt   = r.GetDateTime(r.GetOrdinal("created_at")),
        UpdatedAt   = r.GetDateTime(r.GetOrdinal("updated_at")),
        AuditUserId = r.GetGuid(r.GetOrdinal("audit_user_id"))
    };

    public override async Task<Product?> GetByIdAsync(Guid id)
    {
        return await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_get_product_by_id(@p_id)",
            MapProduct,
            Param("p_id", NpgsqlDbType.Uuid, id));
    }

    public override async Task<IReadOnlyList<Product>> GetAllAsync()
    {
        var (items, _) = await GetPagedAsync(1, 1000, null, null);
        return items;
    }

    public async Task<(IReadOnlyList<Product> Items, long TotalCount)> GetPagedAsync(
        int page, int pageSize, Guid? categoryId, string? search)
    {
        long total = 0;
        var products = new List<Product>();

        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT * FROM sp_get_products(@p_page, @p_size, @p_category_id, @p_search)", conn);
        cmd.Parameters.Add(Param("p_page", NpgsqlDbType.Integer, page));
        cmd.Parameters.Add(Param("p_size", NpgsqlDbType.Integer, pageSize));
        cmd.Parameters.Add(Param("p_category_id", NpgsqlDbType.Uuid, categoryId));
        cmd.Parameters.Add(Param("p_search", NpgsqlDbType.Varchar, search));

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            products.Add(MapProduct(reader));

            if (total == 0)
            {
                total = reader.GetInt64(reader.GetOrdinal("total_count"));
            }
        }
        return (products, total);
    }

    public override async Task<Product> AddAsync(Product entity)
    {
        var inserted = await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_insert_product(@p_name, @p_description, @p_sku, @p_price, @p_quantity, @p_category_id, @p_audit_user_id)",
            MapProduct,
            Param("p_name",          NpgsqlDbType.Varchar, entity.Name),
            Param("p_description",   NpgsqlDbType.Varchar, entity.Description),
            Param("p_sku",           NpgsqlDbType.Varchar, entity.Sku),
            Param("p_price",         NpgsqlDbType.Numeric, entity.Price),
            Param("p_quantity",      NpgsqlDbType.Integer, entity.Quantity),
            Param("p_category_id",   NpgsqlDbType.Uuid,    entity.CategoryId),
            Param("p_audit_user_id", NpgsqlDbType.Uuid,    entity.AuditUserId));

        return inserted ?? throw new InvalidOperationException("Insert did not return a row.");
    }

    public override async Task<Product?> UpdateAsync(Product entity)
    {
        return await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_update_product(@p_id, @p_name, @p_description, @p_sku, @p_price, @p_quantity, @p_category_id)",
            MapProduct,
            Param("p_id",          NpgsqlDbType.Uuid,    entity.Id),
            Param("p_name",        NpgsqlDbType.Varchar, entity.Name),
            Param("p_description", NpgsqlDbType.Varchar, entity.Description),
            Param("p_sku",         NpgsqlDbType.Varchar, entity.Sku),
            Param("p_price",       NpgsqlDbType.Numeric, entity.Price),
            Param("p_quantity",    NpgsqlDbType.Integer, entity.Quantity),
            Param("p_category_id", NpgsqlDbType.Uuid,    entity.CategoryId));
    }

    public override async Task<bool> DeleteAsync(Guid id)
    {
        var rows = await ExecuteScalarFunctionAsync<int>(
            "SELECT sp_delete_product(@p_id)",
            Param("p_id", NpgsqlDbType.Uuid, id));
        return rows > 0;
    }
}
