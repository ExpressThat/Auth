using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Api.Filters;

public class AuthorizeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasAuthorize =
            context.MethodInfo.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any()
            || context.MethodInfo.DeclaringType
                ?.GetCustomAttributes(true).OfType<AuthorizeAttribute>()
                .Any() == true;

        if (!hasAuthorize)
        {
            // Explicitly clear security so this endpoint is not shown as requiring auth.
            operation.Security = [];
            return;
        }

        operation.Responses["401"] = new OpenApiResponse { Description = "Unauthorized" };
    }
}
