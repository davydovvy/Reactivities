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
                .ForMember(dest  => dest.DisplayName, opt => opt.MapFrom(source => source.AppUser.DisplayName));                
        }
    }
}