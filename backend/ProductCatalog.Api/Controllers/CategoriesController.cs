using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductCatalog.Api.Dtos;
using ProductCatalog.Api.Entities;
using ProductCatalog.Api.Repositories;
using ProductCatalog.Api.Trees;
using ProductCatalog.Api.Validation;

namespace ProductCatalog.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categories;

    public CategoriesController(ICategoryRepository categories)
    {
        _categories = categories;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var rows = await _categories.GetAllAsync();
        return Ok(rows.Select(ToDto));
    }

    // Hierarchical tree of categories. DB returns a flat list; I build the tree in memory
    [HttpGet("tree")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<CategoryTreeNode>>> GetTree()
    {
        var rows = await _categories.GetAllAsync();
        var tree = CategoryTree.Build(rows);
        return Ok(tree);
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var validation = CategoryValidator.Validate(request);
        if (!validation.IsValid) return BadRequest(new { error = validation.Error });

        var entity = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            ParentCategoryId = request.ParentCategoryId,
            AuditUserId = GetCurrentUserId()
        };

        var created = await _categories.AddAsync(entity);
        return CreatedAtAction(nameof(GetAll), null, ToDto(created));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var validation = CategoryValidator.Validate(request);
        if (!validation.IsValid) return BadRequest(new { error = validation.Error });

        if (request.ParentCategoryId is { } parentId && parentId == id)
        {
            return BadRequest(new { error = "Category cannot be its own parent." });
        }

        var entity = new Category
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            ParentCategoryId = request.ParentCategoryId
        };

        var updated = await _categories.UpdateAsync(entity);
        if (updated is null) return NotFound(new { error = $"Category {id} not found." });
        return Ok(ToDto(updated));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await _categories.DeleteAsync(id);
        if (!ok) return NotFound(new { error = $"Category {id} not found." });
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }

    private static CategoryDto ToDto(Category c) => new(
        c.Id, c.Name, c.Description, c.ParentCategoryId, c.AuditUserId, c.CreatedAt);
}
