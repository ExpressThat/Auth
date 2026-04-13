using Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Bind the URL/port from environment variable so docker / turbo can override it
var port = Environment.GetEnvironmentVariable("PORT") ?? "3001";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "ExpressThat Auth API",
            Description = "API documentation for the ExpressThat Auth service",
            Version = "1.0",
        }
    );
    options.CustomOperationIds(apiDesc =>
    {
        if (apiDesc.ActionDescriptor is ControllerActionDescriptor controllerAction)
        {
            return controllerAction.ActionName;
        }
        return null;
    });
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter your JWT token.",
        }
    );
    // Apply Bearer globally; the operation filter removes it from non-[Authorize] endpoints.
    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", doc)] = [],
    });
    options.OperationFilter<AuthorizeOperationFilter>();
});

var app = builder.Build();

// Swagger UI lives at /api/docs (mirrors the previous NestJS setup)
app.UseSwagger(c =>
{
    c.RouteTemplate = "api/swagger/{documentName}/swagger.json";
});
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/api/swagger/v1/swagger.json", "ExpressThat Auth API v1");
    c.RoutePrefix = "api/docs";
});

app.MapControllers();

Console.WriteLine($"Starting ExpressThat Auth API on port {port}..., http://localhost:{port}/api/docs");

await app.RunAsync();
