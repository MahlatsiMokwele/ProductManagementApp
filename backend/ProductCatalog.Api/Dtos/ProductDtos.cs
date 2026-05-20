using ProductCatalog.Api.Serialization;

namespace ProductCatalog.Api.Dtos;

// Response DTO for a single product.
public record ProductDto(
    Guid Id,
    string Name,
    string? Description,
    string Sku,
    [property: JsonConverter(typeof(PriceJsonConverter))] decimal Price,
    int Quantity,
    Guid? CategoryId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid AuditUserId
);

// Request body - POST /api/products.
public record CreateProductRequest(
    string Name,
    string? Description,
    string Sku,
    decimal Price,
    int Quantity,
    Guid? CategoryId
);

// Request body - PUT /api/products/{id}
public record UpdateProductRequest(
    string Name,
    string? Description,
    string Sku,
    decimal Price,
    int Quantity,
    Guid? CategoryId
);

// Response
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    long TotalCount
)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
}
