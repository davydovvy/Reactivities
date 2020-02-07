using API.Middleware;
using Application.Activities;
using Application.Interfaces;
using FluentValidation.AspNetCore;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Persistence;

namespace API
{
   public class Startup
   {
      public Startup(IConfiguration configuration)
      {
         Configuration = configuration;
      }

      public IConfiguration Configuration { get; }

      // This method gets called by the runtime. Use this method to add services to the container.
      public void ConfigureServices(IServiceCollection services)
      {
         services.AddControllers(opt =>
         {
             var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
             opt.Filters.Add(new AuthorizeFilter(policy));
         })
             .AddFluentValidation(cfg =>
             {
                cfg.RegisterValidatorsFromAssemblyContaining<Create>();
             });
         services.AddDbContext<DataContext>(opt =>
         {
            opt.UseSqlite(Configuration.GetConnectionString("DefaultConnection"));
         });
         services.AddCors(opt =>
         {
            opt.AddPolicy("CorsPolicy", policy =>
               {
                policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:3000");
             });
         });
         services.AddMediatR(typeof(List.Handler).Assembly);

         var builder = services.AddIdentityCore<Domain.AppUser>();
         var identityBuilder = new IdentityBuilder(builder.UserType, builder.Services);
         identityBuilder.AddEntityFrameworkStores<DataContext>();
         identityBuilder.AddSignInManager<SignInManager<Domain.AppUser>>();

         var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(Configuration["TokenKey"]));
         services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(opt =>
        {
           opt.TokenValidationParameters = new TokenValidationParameters
           {
              ValidateIssuerSigningKey = true,
              IssuerSigningKey = key,
              ValidateAudience = false,
              ValidateIssuer = false
           };
        });
         services.AddScoped<IJWTGenerator, JwtGenerator>();
         services.AddScoped<IUserAccessor, UserAccessor>();
      }

      // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
      public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
      {
         if (env.IsDevelopment())
         {
            //app.UseDeveloperExceptionPage();
            Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;
         }

         app.UseMiddleware<ErrorHandlingMiddleware>();

         // app.UseHttpsRedirection();

         app.UseRouting();
         app.UseCors("CorsPolicy");

         app.UseAuthentication();
         app.UseAuthorization();

         app.UseEndpoints(endpoints =>
         {
            endpoints.MapControllers();
         });
      }
   }
}
