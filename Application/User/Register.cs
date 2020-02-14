using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Validators;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.User
{
   public class Register
   {
      public class Command : IRequest<UserToReturn>
      {
         public string DisplayName { get; set; }
         public string UserName { get; set; }
         public string Email { get; set; }
         public string Password { get; set; }
      }

      public class CommandValidator : AbstractValidator<Command>
      {
         public CommandValidator()
         {
            RuleFor(x => x.DisplayName).NotEmpty();
            RuleFor(x => x.UserName).NotEmpty();
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).Password();
         }
      }

      public class Handler : IRequestHandler<Command, UserToReturn>
      {
         private readonly DataContext _context;
         private readonly UserManager<AppUser> _userManager;
         private readonly IJWTGenerator _jwtGenerator;
         public Handler(DataContext context, UserManager<AppUser> userManager, IJWTGenerator jwtGenerator)
         {
            _jwtGenerator = jwtGenerator;
            _userManager = userManager;
            _context = context;
         }

         public async Task<UserToReturn> Handle(Command request, CancellationToken cancellationToken)
         {
            if (await _context.Users.Where(u => u.Email == request.Email).AnyAsync())
               throw new Errors.RestException(System.Net.HttpStatusCode.BadRequest, new { Email = "Email already exists" });

            if (await _context.Users.Where(u => u.UserName == request.UserName).AnyAsync())
               throw new Errors.RestException(System.Net.HttpStatusCode.BadRequest, new { UserName = "UserName already exists" });

            var user = new AppUser
            {
                DisplayName = request.DisplayName,
                UserName = request.UserName,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                return new UserToReturn
                {
                    DisplayName = user.DisplayName,
                    Token = _jwtGenerator.CreateToken(user),
                    Username = user.UserName,
                    Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url
                };
            };

            // var success = await _context.SaveChangesAsync() > 0;
            // if (success) return Unit.Value;

            throw new System.Exception("Problem saving changes");
         }
      }
   }
}