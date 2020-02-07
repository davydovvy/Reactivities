using System.Threading.Tasks;
using Application.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
   public class UserController : CustomBaseController
   {
      [AllowAnonymous]
      [HttpPost("login")]
      public async Task<ActionResult<UserToReturn>> Login(Login.Query query)
      {
         return await Mediator.Send(query);
      }
      
      [AllowAnonymous]
      [HttpPost("register")]
      public async Task<ActionResult<UserToReturn>> Register(Register.Command command)
      {
         return await Mediator.Send(command);
      }

      [HttpGet]
      public async Task<ActionResult<UserToReturn>> CurrentUser()
      {
         return await Mediator.Send(new CurrentUser.Query());
      }
   }
}