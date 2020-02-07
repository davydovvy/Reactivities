namespace Application.Interfaces
{
    public interface IJWTGenerator
    {
         string CreateToken(Domain.AppUser user);
    }
}