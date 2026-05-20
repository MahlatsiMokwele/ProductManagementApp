namespace ProductCatalog.Api.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public Guid AuditUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
