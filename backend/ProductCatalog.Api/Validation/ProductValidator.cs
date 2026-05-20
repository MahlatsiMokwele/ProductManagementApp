using ProductCatalog.Api.Dtos;
using ProductCatalog.Api.Entities;

namespace ProductCatalog.Api.Validation;

// Validation result returned by the pattern-matching validators
public readonly record struct ValidationResult(bool IsValid, string? Error)
{
    public static ValidationResult Ok() => new(true, null);
    public static ValidationResult Fail(string error) => new(false, error);
}

public static class ProductValidator
{
    // Validates create product request
    public static ValidationResult Validate(CreateProductRequest? request) =>
        request switch
        {
            null                                            => ValidationResult.Fail("Request body is required."),
            { Name: null or "" }                            => ValidationResult.Fail("Name is required."),
            { Name.Length: > 255 }                          => ValidationResult.Fail("Name must be 255 characters or fewer."),
            { Description.Length: > 255 }                   => ValidationResult.Fail("Description must be 255 characters or fewer."),
            { Sku: null or "" }                             => ValidationResult.Fail("SKU is required."),
            { Sku.Length: > 50 }                            => ValidationResult.Fail("SKU must be 50 characters or fewer."),
            { Price: < 0 }                                  => ValidationResult.Fail("Price cannot be negative."),
            { Quantity: < 0 }                               => ValidationResult.Fail("Quantity cannot be negative."),
            _                                               => ValidationResult.Ok()
        };

    public static ValidationResult Validate(UpdateProductRequest? request) =>
        request switch
        {
            null                                            => ValidationResult.Fail("Request body is required."),
            { Name: null or "" }                            => ValidationResult.Fail("Name is required."),
            { Name.Length: > 255 }                          => ValidationResult.Fail("Name must be 255 characters or fewer."),
            { Description.Length: > 255 }                   => ValidationResult.Fail("Description must be 255 characters or fewer."),
            { Sku: null or "" }                             => ValidationResult.Fail("SKU is required."),
            { Sku.Length: > 50 }                            => ValidationResult.Fail("SKU must be 50 characters or fewer."),
            { Price: < 0 }                                  => ValidationResult.Fail("Price cannot be negative."),
            { Quantity: < 0 }                               => ValidationResult.Fail("Quantity cannot be negative."),
            _                                               => ValidationResult.Ok()
        };
}

public static class CategoryValidator
{
    public static ValidationResult Validate(CreateCategoryRequest? request) =>
        request switch
        {
            null                                            => ValidationResult.Fail("Request body is required."),
            { Name: null or "" }                            => ValidationResult.Fail("Name is required."),
            { Name.Length: > 255 }                          => ValidationResult.Fail("Name must be 255 characters or fewer."),
            { Description.Length: > 255 }                   => ValidationResult.Fail("Description must be 255 characters or fewer."),
            _                                               => ValidationResult.Ok()
        };

    public static ValidationResult Validate(UpdateCategoryRequest? request) =>
        request switch
        {
            null                                            => ValidationResult.Fail("Request body is required."),
            { Name: null or "" }                            => ValidationResult.Fail("Name is required."),
            { Name.Length: > 255 }                          => ValidationResult.Fail("Name must be 255 characters or fewer."),
            { Description.Length: > 255 }                   => ValidationResult.Fail("Description must be 255 characters or fewer."),
            _                                               => ValidationResult.Ok()
        };
}

public static class AuthValidator
{
    public static ValidationResult Validate(RegisterRequest? request) =>
        request switch
        {
            null                                            => ValidationResult.Fail("Request body is required."),
            { Username: null or "" }                        => ValidationResult.Fail("Username is required."),
            { Username.Length: < 3 or > 100 }               => ValidationResult.Fail("Username must be 3-100 characters."),
            { Password: null or "" }                        => ValidationResult.Fail("Password is required."),
            { Password.Length: < 8 }                        => ValidationResult.Fail("Password must be at least 8 characters."),
            { Name: null or "" }                            => ValidationResult.Fail("Name is required."),
            { Surname: null or "" }                         => ValidationResult.Fail("Surname is required."),
            { Role: var r } when !UserRoles.IsValid(r)      => ValidationResult.Fail("Role must be 'admin' or 'employee'."),
            _                                               => ValidationResult.Ok()
        };

    public static ValidationResult Validate(LoginRequest? request) =>
        request switch
        {
            null                                            => ValidationResult.Fail("Request body is required."),
            { Username: null or "" }                        => ValidationResult.Fail("Username is required."),
            { Password: null or "" }                        => ValidationResult.Fail("Password is required."),
            _                                               => ValidationResult.Ok()
        };
}
