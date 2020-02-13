import { IActivity, IAttendee } from '../../models/activity';
import { IUser } from '../../models/user';

export const combineDateAndTime = (date: Date, time: Date) => {
   const timeString = time.getHours() + ':' + time.getMinutes() + ':00';
   const year = date.getFullYear();
   const month = date.getMonth() + 1;
   const day = date.getDate();
   const dateString = `${year}-${month}-${day}`;

   return new Date(dateString + ' ' + timeString);
};

export const setActivityProps = (activity: IActivity, currentUser: IUser) => {
   activity.date = new Date(activity.date);
   activity.isGoing = activity.attendees.some(
      a => a.username === currentUser.username
   );
   activity.isHost = activity.attendees.some(
      a => a.username === currentUser.username && a.isHost
   );
   return activity;
};

export const createAttendee = (user: IUser) : IAttendee => {
   return {
      displayName: user.displayName,
      isHost: false,
      username: user.username,
      image: user.image!
   }
} 
