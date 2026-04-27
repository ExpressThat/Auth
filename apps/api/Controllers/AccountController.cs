using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public record CreateAccountRequest(string Email, string Password);

public record CreateAccountResponse(int Id, string Email);


[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    [HttpPost]
    public ActionResult<CreateAccountResponse> Register(CreateAccountRequest request)
    {
        return this.Ok(new CreateAccountResponse(1, request.Email));
    }
}
