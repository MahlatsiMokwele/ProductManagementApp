using ProductCatalog.Api.Entities;

namespace ProductCatalog.Api.Extensions;

// Custom LINQ extension methods for product filtering
public static class ProductQueryExtensions
{
    // Filter to a specific category
    public static IEnumerable<Product> InCategory(this IEnumerable<Product> source, Guid? categoryId) =>
        categoryId is null ? source : source.Where(p => p.CategoryId == categoryId);

    // Items with at least one unit in stock.
    public static IEnumerable<Product> InStock(this IEnumerable<Product> source) =>
        source.Where(p => p.Quantity > 0);

    // Items currently out of stock
    public static IEnumerable<Product> OutOfStock(this IEnumerable<Product> source) =>
        source.Where(p => p.Quantity <= 0);

    // Item quantity is at or below a low-stock threshold
    public static IEnumerable<Product> LowStock(this IEnumerable<Product> source, int threshold = 5) =>
        source.Where(p => p.Quantity > 0 && p.Quantity <= threshold);

    // Inclusive price range filter
    public static IEnumerable<Product> PriceBetween(this IEnumerable<Product> source, decimal? min, decimal? max) =>
        source.Where(p => (min is null || p.Price >= min) && (max is null || p.Price <= max));

    // Case-insensitive substring match on the product name
    public static IEnumerable<Product> WhereNameContains(this IEnumerable<Product> source, string? substring)
    {
        if (string.IsNullOrWhiteSpace(substring)) return source;
        return source.Where(p =>
            p.Name.Contains(substring, StringComparison.OrdinalIgnoreCase));
    }

    //Order by name
    public static IEnumerable<Product> OrderByName(this IEnumerable<Product> source) =>
        source.OrderBy(p => p);  // uses Product.CompareTo

    // Page the sequence
    public static IEnumerable<Product> Page(this IEnumerable<Product> source, int page, int pageSize) =>
        source.Skip(Math.Max(0, (page - 1) * pageSize)).Take(Math.Max(1, pageSize));
}
