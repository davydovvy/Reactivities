using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
   public class Delete
   {
      public class Command : IRequest
      {
         public string Id { get; set; }
      }

      public class Handler : IRequestHandler<Command>
      {
         private readonly DataContext _context;
         private readonly IUserAccessor _userAccessor;
         private readonly IPhotoAccessor _photoAccessor;
         public Handler(DataContext context, IUserAccessor userAccessor, IPhotoAccessor photoAccessor)
         {
            _photoAccessor = photoAccessor;
            _userAccessor = userAccessor;
            _context = context;
         }

         public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
         {
            var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == _userAccessor.GetCurrentUsername());

            var photo = user.Photos.FirstOrDefault(x => x.Id == request.Id);

            if (photo == null)
                throw new Errors.RestException(HttpStatusCode.NotFound, new {Photo = "Not found"});

            if (photo.IsMain)
                throw new Errors.RestException(HttpStatusCode.BadRequest, new {Photo = "You cannot delete your main photo"});

            var result = _photoAccessor.DeletePhoto(photo.Id);
            
            if (result == null)
                throw new System.Exception("Problem deleting the photo");

            user.Photos.Remove(photo);

            var success = await _context.SaveChangesAsync() > 0;

            if (success) return Unit.Value;

            throw new System.Exception("Problem saving changes");
         }
      }
   }
}