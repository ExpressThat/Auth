using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public record Person(int Id, string Name, string Email);

public record CreatePersonRequest(string Name, string Email);

public record UpdatePersonRequest(string? Name, string? Email);

[ApiController]
[Route("api/[controller]")]
public class PeopleController : ControllerBase
{
    private static readonly List<Person> _people =
    [
        new(1, "Alice Johnson", "alice@example.com"),
        new(2, "Bob Smith", "bob@example.com"),
        new(3, "Charlie Brown", "charlie@example.com"),
    ];

    private static int _nextId = 4;

    [HttpGet]
    public ActionResult<IEnumerable<Person>> ListPeople() => Ok(_people);

    [HttpGet("{id:int}")]
    public ActionResult<Person> GetPersonById(int id)
    {
        var person = _people.FirstOrDefault(p => p.Id == id);
        return person is null ? NotFound() : Ok(person);
    }

    [Authorize]
    [HttpPost]
    public ActionResult<Person> CreatePerson(CreatePersonRequest request)
    {
        var person = new Person(_nextId++, request.Name, request.Email);
        _people.Add(person);
        return CreatedAtAction(nameof(GetPersonById), new { id = person.Id }, person);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public ActionResult<Person> UpdatePerson(int id, UpdatePersonRequest request)
    {
        var index = _people.FindIndex(p => p.Id == id);
        if (index < 0)
            return NotFound();

        var existing = _people[index];
        var updated = existing with
        {
            Name = request.Name ?? existing.Name,
            Email = request.Email ?? existing.Email,
        };
        _people[index] = updated;
        return Ok(updated);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public IActionResult DeletePerson(int id)
    {
        var person = _people.FirstOrDefault(p => p.Id == id);
        if (person is null)
            return NotFound();
        _people.Remove(person);
        return NoContent();
    }
}
