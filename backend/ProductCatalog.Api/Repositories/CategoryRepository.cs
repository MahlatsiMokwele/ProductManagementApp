using ProductCatalog.Api.Entities;

namespace ProductCatalog.Api.Repositories;

public interface ICategoryRepository : IRepository<Category, Guid> { }

public class CategoryRepository : RepositoryBase<Category, Guid>, ICategoryRepository
{
    public CategoryRepository(IConfiguration configuration) : base(configuration) { }

    private static Category MapCategory(NpgsqlDataReader r) => new()
    {
        Id                 = r.GetGuid(r.GetOrdinal("id")),
        Name               = r.GetString(r.GetOrdinal("name")),
        Description        = r.IsDBNull(r.GetOrdinal("description")) ? null : r.GetString(r.GetOrdinal("description")),
        ParentCategoryId   = r.IsDBNull(r.GetOrdinal("parent_category_id")) ? null : r.GetGuid(r.GetOrdinal("parent_category_id")),
        AuditUserId        = r.GetGuid(r.GetOrdinal("audit_user_id")),
        CreatedAt          = r.GetDateTime(r.GetOrdinal("created_at"))
    };

    public override async Task<Category?> GetByIdAsync(Guid id) =>
        await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_get_category_by_id(@p_id)",
            MapCategory,
            Param("p_id", NpgsqlDbType.Uuid, id));

    public override async Task<IReadOnlyList<Category>> GetAllAsync() =>
        await ExecuteFunctionListAsync(
            "SELECT * FROM sp_get_categories()",
            MapCategory);

    public override async Task<Category> AddAsync(Category entity)
    {
        var inserted = await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_insert_category(@p_name, @p_description, @p_parent_category_id, @p_audit_user_id)",
            MapCategory,
            Param("p_name",                NpgsqlDbType.Varchar, entity.Name),
            Param("p_description",         NpgsqlDbType.Varchar, entity.Description),
            Param("p_parent_category_id",  NpgsqlDbType.Uuid,    entity.ParentCategoryId),
            Param("p_audit_user_id",       NpgsqlDbType.Uuid,    entity.AuditUserId));
        return inserted ?? throw new InvalidOperationException("Insert did not return a row.");
    }

    public override async Task<Category?> UpdateAsync(Category entity) =>
        await ExecuteFunctionSingleAsync(
            "SELECT * FROM sp_update_category(@p_id, @p_name, @p_description, @p_parent_category_id)",
            MapCategory,
            Param("p_id",                 NpgsqlDbType.Uuid,    entity.Id),
            Param("p_name",               NpgsqlDbType.Varchar, entity.Name),
            Param("p_description",        NpgsqlDbType.Varchar, entity.Description),
            Param("p_parent_category_id", NpgsqlDbType.Uuid,    entity.ParentCategoryId));

    public override async Task<bool> DeleteAsync(Guid id)
    {
        var rows = await ExecuteScalarFunctionAsync<int>(
            "SELECT sp_delete_category(@p_id)",
            Param("p_id", NpgsqlDbType.Uuid, id));
        return rows > 0;
    }
}
