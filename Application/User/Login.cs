using Microsoft.AspNetCore.Identity;
using System.Threading;
using System.Threading.Tasks;
using Domain;
using FluentValidation;
using MediatR;
using Application.Interfaces;

namespace Application.User
{
   public class Login
   {
      public class Query : IRequest<UserToReturn>
      {
         public string Email { get; set; }
         public string Password { get; set; }
      }

      public class QueryValidator : AbstractValidator<Query>
      {
         public QueryValidator()
         {
            RuleFor(x => x.Email).NotEmpty();
            RuleFor(x => x.Password).NotEmpty();
         }
      }

      public class Handler : IRequestHandler<Query, UserToReturn>
      {
         private readonly UserManager<AppUser> _userManager;
         private readonly SignInManager<AppUser> _signInManager;
         private readonly IJWTGenerator _jwtGenerator;
         public Handler(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, IJWTGenerator jwtGenerator)
         {
            _jwtGenerator = jwtGenerator;
            _signInManager = signInManager;
            _userManager = userManager;
         }

         public async Task<UserToReturn> Handle(Query request, CancellationToken cancellationToken)
         {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
               throw new Errors.RestException(System.Net.HttpStatusCode.Unauthorized);

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (result.Succeeded)
            {
               //TODO: generate token
               return new UserToReturn
               {
                  DisplayName = user.DisplayName,
                  Token = _jwtGenerator.CreateToken(user),
                  Username = user.UserName,
                  Image = null
               };
            }
            else
               throw new Errors.RestException(System.Net.HttpStatusCode.Unauthorized);
         }
      }
   }
}