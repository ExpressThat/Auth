using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public record Todo(int Id, string Title, bool Completed);

public record CreateTodoRequest(string Title, bool Completed = false);

public record UpdateTodoRequest(string? Title, bool? Completed);

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for all endpoints in this controller
public class TodosController : ControllerBase
{
    private static readonly List<Todo> _todos =
    [
        new(1, "Buy groceries", false),
        new(2, "Read a book", true),
        new(3, "Go for a run", false),
    ];

    private static int _nextId = 4;

    [HttpGet]
    public ActionResult<IEnumerable<Todo>> ListTodos() => Ok(_todos);

    [HttpGet("{id:int}")]
    public ActionResult<Todo> GetTodoById(int id)
    {
        var todo = _todos.FirstOrDefault(t => t.Id == id);
        return todo is null ? NotFound() : Ok(todo);
    }

    [HttpPost]
    public ActionResult<Todo> CreateTodo(CreateTodoRequest request)
    {
        var todo = new Todo(_nextId++, request.Title, request.Completed);
        _todos.Add(todo);
        return CreatedAtAction(nameof(GetTodoById), new { id = todo.Id }, todo);
    }

    [HttpPut("{id:int}")]
    public ActionResult<Todo> UpdateTodo(int id, UpdateTodoRequest request)
    {
        var index = _todos.FindIndex(t => t.Id == id);
        if (index < 0)
            return NotFound();

        var existing = _todos[index];
        var updated = existing with
        {
            Title = request.Title ?? existing.Title,
            Completed = request.Completed ?? existing.Completed,
        };
        _todos[index] = updated;
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public IActionResult DeleteTodo(int id)
    {
        var todo = _todos.FirstOrDefault(t => t.Id == id);
        if (todo is null)
            return NotFound();
        _todos.Remove(todo);
        return NoContent();
    }
}
