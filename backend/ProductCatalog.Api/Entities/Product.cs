namespace ProductCatalog.Api.Entities;

public class Product : IComparable<Product>, IComparable
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public Guid? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid AuditUserId { get; set; }

    // IComparable<Product> : Natural ordering - Name ascending, case-insensitive.
    public int CompareTo(Product? other)
    {
        if (other is null) return 1;
        return string.Compare(Name, other.Name, StringComparison.OrdinalIgnoreCase);
    }

    public int CompareTo(object? obj) => obj switch
    {
        null => 1,
        Product p => CompareTo(p),
        _ => throw new ArgumentException($"Cannot compare Product to {obj.GetType().Name}", nameof(obj))
    };

    // True when stock is at zero (helper for the inventory view)
    public bool IsOutOfStock => Quantity <= 0;
}
