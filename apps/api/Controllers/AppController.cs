using ExampleLib;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api")]
public class AppController : ControllerBase
{
    /// <summary>Returns a simple Hello World greeting.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public string GetHello() => "Hello World!";

    /// <summary>Returns a personalised greeting for the given name.</summary>
    /// <param name="name">The name to greet.</param>
    [HttpGet("name")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<string> GetName([FromQuery] string name)
    {
        await Task.Delay(1000); // simulate async operation
        return $"Hello, {name}!";
    }

    /// <summary>
    /// Demonstrates calling into a C# workspace package (@expressthat-auth/example-lib).
    /// Remove this endpoint once you replace example-lib with your own packages.
    /// </summary>
    /// <param name="name">The name to greet.</param>
    [HttpGet("example")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public string GetExample([FromQuery] string name = "World") =>
        Greeter.Greet(name);
}
