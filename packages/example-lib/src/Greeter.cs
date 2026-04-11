namespace ExampleLib;

/// <summary>
/// Example service showing how a C# workspace package can export functionality
/// that is consumed by the API (or other C# apps) via pnpm workspace references.
///
/// Usage in the consuming app's package.json:
/// <code>
///   "dependencies": {
///     "@expressthat-auth/example-lib": "workspace:*"
///   }
/// </code>
///
/// pnpm will symlink this package into node_modules/@expressthat-auth/example-lib,
/// and the API's Api.csproj will automatically pick up ExampleLib.csproj as a
/// ProjectReference via the glob pattern in its ItemGroup.
/// </summary>
public static class Greeter
{
    /// <summary>Returns a formatted greeting.</summary>
    public static string Greet(string name) => $"Hello from ExampleLib, {name}!";
}
