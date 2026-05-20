namespace ProductCatalog.Api.Dtos;

// Flat  category
public record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    Guid? ParentCategoryId,
    Guid AuditUserId,
    DateTime CreatedAt
);

//Tree node - GET /api/categories/tree. Children are nested
public record CategoryTreeNode(
    Guid Id,
    string Name,
    string? Description,
    List<CategoryTreeNode> Children
);

// Request body - POST /api/categories
public record CreateCategoryRequest(
    string Name,
    string? Description,
    Guid? ParentCategoryId
);

// Request body - PUT /api/categories/{id}.
public record UpdateCategoryRequest(
    string Name,
    string? Description,
    Guid? ParentCategoryId
);
