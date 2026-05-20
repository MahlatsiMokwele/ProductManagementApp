using System.Text.Json;
namespace ProductCatalog.Api.Middleware;

// Catche unhandled exceptions and convert them to JSON error response.
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var traceId = context.TraceIdentifier;
            _logger.LogError(ex, "Unhandled exception. TraceId={TraceId}", traceId);

            // pick the right status code.
            var status = ex switch
            {
                ArgumentException        => StatusCodes.Status400BadRequest,
                KeyNotFoundException     => StatusCodes.Status404NotFound,
                UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                NotSupportedException    => StatusCodes.Status501NotImplemented,
                _                        => StatusCodes.Status500InternalServerError
            };

            // If response already written by an earlier middleware - can't change the status; bail out.
            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";

            var body = new
            {
                error = status == StatusCodes.Status500InternalServerError
                    ? "An unexpected error occurred."
                    : ex.Message,
                traceId
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(body));
        }
    }
}
