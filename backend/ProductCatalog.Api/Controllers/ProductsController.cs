using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductCatalog.Api.Caching;
using ProductCatalog.Api.Dtos;
using ProductCatalog.Api.Entities;
using ProductCatalog.Api.Extensions;
using ProductCatalog.Api.Repositories;
using ProductCatalog.Api.Search;
using ProductCatalog.Api.Validation;

namespace ProductCatalog.Api.Controllers;

/* controller for products
   - DI
   - LINQ extensions for in-memory filtering.
   - Pattern matching in validation - ProductValidator.
   - Manual model binding on POST.
   - Search cache keyed on query parameters.
   - Role-based authorization on writes. */
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _products;
    private readonly ProductSearchEngine<Product> _searchEngine;
    private readonly SearchCache _cache;

    public ProductsController(
        IProductRepository products,
        ProductSearchEngine<Product> searchEngine,
        SearchCache cache)
    {
        _products = products;
        _searchEngine = searchEngine;
        _cache = cache;
    }

    // product list with pagination, optional category filter, and optional fuzzy search
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var cacheKey = $"products|p={page}|s={pageSize}|c={categoryId}|q={search?.ToLowerInvariant()}";
        var cached = _cache.TryGet(cacheKey);
        if (cached is not null)
        {
            Response.Headers["X-Cache"] = "HIT";
            return Ok(cached);
        }

        IReadOnlyList<Product> items;
        long total;

        if (!string.IsNullOrWhiteSpace(search))
        {
            // Fuzzy search path: pull page from the DB (still filtered by category in SQL), then re-rank in memory using the search engine so we get fuzzy matches (e.g. "lptop" -> "laptop").
            var (raw, _) = await _products.GetPagedAsync(1, 500, categoryId, null);
            var ranked = _searchEngine.Search(search, raw).Select(r => r.Item).ToList();
            total = ranked.Count;
            items = ranked
                .AsEnumerable()
                .Page(page, pageSize)
                .ToList();
        }
        else
        {
            // No search
            var (raw, totalCount) = await _products.GetPagedAsync(page, pageSize, categoryId, null);
            items = raw;
            total = totalCount;
        }

        var dtos = items.Select(ToDto).ToList();
        var result = new PagedResult<ProductDto>(dtos, page, pageSize, total);

        _cache.Set(cacheKey, result);
        Response.Headers["X-Cache"] = "MISS";
        return Ok(result);
    }

    // Inventory view: low-stock products. Uses the custom LINQ extensions 
    [HttpGet("low-stock")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetLowStock([FromQuery] int threshold = 5)
    {
        var all = await _products.GetAllAsync();
        var lowStock = all
            .LowStock(threshold)
            .OrderByName()      // IComparable<Product>
            .Select(ToDto)
            .ToList();
        return Ok(lowStock);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductDto>> GetById(Guid id)
    {
        var product = await _products.GetByIdAsync(id);
        if (product is null) return NotFound(new { error = $"Product {id} not found." });
        return Ok(ToDto(product));
    }


    // Create a product. ADMIN ONLY.
    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<ProductDto>> Create()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        CreateProductRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<CreateProductRequest>(body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException ex)
        {
            return BadRequest(new { error = $"Invalid JSON: {ex.Message}" });
        }

        if (request is null)
        {
            return BadRequest(new { error = "Request body is empty." });
        }

        var validation = ProductValidator.Validate(request);
        if (!validation.IsValid) return BadRequest(new { error = validation.Error });

        var entity = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Sku = request.Sku,
            Price = request.Price,
            Quantity = request.Quantity,
            CategoryId = request.CategoryId,
            AuditUserId = GetCurrentUserId()
        };

        var created = await _products.AddAsync(entity);
        _cache.Clear();
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<ProductDto>> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        var validation = ProductValidator.Validate(request);
        if (!validation.IsValid) return BadRequest(new { error = validation.Error });

        var entity = new Product
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            Sku = request.Sku,
            Price = request.Price,
            Quantity = request.Quantity,
            CategoryId = request.CategoryId
        };

        var updated = await _products.UpdateAsync(entity);
        if (updated is null) return NotFound(new { error = $"Product {id} not found." });

        _cache.Clear();
        return Ok(ToDto(updated));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await _products.DeleteAsync(id);
        if (!ok) return NotFound(new { error = $"Product {id} not found." });
        _cache.Clear();
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id, p.Name, p.Description, p.Sku, p.Price, p.Quantity,
        p.CategoryId, p.CreatedAt, p.UpdatedAt, p.AuditUserId);
}
