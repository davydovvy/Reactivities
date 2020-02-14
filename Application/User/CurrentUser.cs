using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Application.User
{
   public class CurrentUser
   {
      public class Query : IRequest<UserToReturn> { }

      public class Handler : IRequestHandler<Query, UserToReturn>
      {
         private readonly UserManager<AppUser> _userManager;
         private readonly IJWTGenerator _jwtGenerator;
         private readonly IUserAccessor _userAccessor;

         public Handler(UserManager<AppUser> userManager, IJWTGenerator jwtGenerator, IUserAccessor userAccessor)
         {
            _userAccessor = userAccessor;
            _jwtGenerator = jwtGenerator;
            _userManager = userManager;
         }

         public async Task<UserToReturn> Handle(Query request, CancellationToken cancellationToken)
         {
            var user = await _userManager.FindByNameAsync(_userAccessor.GetCurrentUsername());
            return new UserToReturn
            {
                DisplayName = user.DisplayName,
                Username = user.UserName,
                Token = _jwtGenerator.CreateToken(user),
                Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url
            };
         }
      }
   }
}