using System.Linq;
using Domain;

namespace Application.Activities
{
    public class MappingProfile : AutoMapper.Profile
    {
        public MappingProfile()
        {
            CreateMap<Activity, ActivityDTO>();
            CreateMap<UserActivity, AttendeeDTO>()
                .ForMember(dest  => dest.Username, opt => opt.MapFrom(source => source.AppUser.UserName))
                .ForMember(dest  => dest.DisplayName, opt => opt.MapFrom(source => source.AppUser.DisplayName))
                .ForMember(dest => dest.Image, opt => opt.MapFrom(source => source.AppUser.Photos.FirstOrDefault(x => x.IsMain).Url))
                .ForMember(dest => dest.Following, opt => opt.MapFrom<FollowingResolver>());
        }
    }
}