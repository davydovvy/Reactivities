import { observable, action, computed, runInAction } from 'mobx';
import { SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';
import { history } from '../..';
import { toast } from 'react-toastify';
import { RootStore } from './rootStore';
import { setActivityProps, createAttendee } from '../common/util/util';

export default class ActivityStore {
   rootStore: RootStore;
   constructor(rootStore: RootStore) {
      this.rootStore = rootStore;
   }

   @observable activityRegistry = new Map();
   @observable activity: IActivity | null = null;
   @observable loadingInitial = false;
   @observable submitting = false;
   @observable targetButton = '';
   @observable loading = false;

   @computed get activitiesByDate() {
      return this.groupActivitiesByDate(
         Array.from(this.activityRegistry.values())
      );
   }

   groupActivitiesByDate(activities: IActivity[]) {
      const sortedActivities = activities.sort(
         (a, b) => a.date.getTime() - b.date.getTime()
      );
      return Object.entries(
         sortedActivities.reduce((activities, activity) => {
            const date = activity.date.toISOString().split('T')[0];
            activities[date] = activities[date]
               ? [...activities[date], activity]
               : [activity];
            return activities;
         }, {} as { [key: string]: IActivity[] })
      );
   }

   @action loadActivities = async () => {
      this.loadingInitial = true;
      const user = this.rootStore.userStore.user;
      try {
         const activities = await agent.Activities.list();
         runInAction('loading activities', () => {
            activities.forEach(activity => {
               setActivityProps(activity, user!);
               this.activityRegistry.set(activity.id, activity);
            });
         });
      } catch (error) {
         console.log(error);
      } finally {
         runInAction('load activities finally', () => {
            this.loadingInitial = false;
         });
      }
   };

   @action loadActivity = async (id: string) => {
      let activity = this.getActivity(id);
      if (activity) {
         this.activity = activity;
         return activity;
      } else {
         this.loadingInitial = true;
         try {
            activity = await agent.Activities.details(id);
            runInAction('getting activity', () => {
               setActivityProps(activity, this.rootStore.userStore.user!);
               this.activity = activity;
               this.activityRegistry.set(activity.id, activity);
            });
            return activity;
         } catch (error) {
            console.log(error);
         } finally {
            runInAction('get activity finally', () => {
               this.loadingInitial = false;
            });
         }
      }
   };

   @action clearActivity = () => {
      this.activity = null;
   };

   getActivity = (id: string) => {
      return this.activityRegistry.get(id);
   };

   @action createActivity = async (activity: IActivity) => {
      this.submitting = true;
      try {
         await agent.Activities.create(activity);
         const attendee = createAttendee(this.rootStore.userStore.user!);
         attendee.isHost = true;
         let attendees = [];
         attendees.push(attendee);
         activity.attendees = attendees;
         activity.isHost = true;
         runInAction('creating activity', () => {
            this.activityRegistry.set(activity.id, activity);
         });
         history.push(`/activities/${activity.id}`);
      } catch (error) {
         toast.error('Problem submitting data');
         console.log(error.response);
      } finally {
         runInAction('create activity finally', () => {
            this.submitting = false;
         });
      }
   };

   @action editActivity = async (activity: IActivity) => {
      this.submitting = true;
      try {
         await agent.Activities.update(activity);
         runInAction('editing activity', () => {
            this.activityRegistry.set(activity.id, activity);
            this.activity = activity;
         });
         history.push(`/activities/${activity.id}`);
      } catch (error) {
         toast.error('Problem submitting data');
         console.log(error.response);
      } finally {
         runInAction('editing activity finally', () => {
            this.submitting = false;
         });
      }
   };

   @action deleteActivity = async (
      event: SyntheticEvent<HTMLButtonElement>,
      id: string
   ) => {
      this.submitting = true;
      this.targetButton = event.currentTarget.name;
      try {
         await agent.Activities.delete(id);
         runInAction('deleting activity', () => {
            this.activityRegistry.delete(id);
         });
      } catch (error) {
         console.log(error);
      } finally {
         runInAction('delete activity finally', () => {
            this.submitting = false;
            this.targetButton = '';
         });
      }
   };

   @action attendActivity = async () => {
      const attendee = createAttendee(this.rootStore.userStore.user!);
      this.loading = true;
      try {
         await agent.Activities.attend(this.activity!.id);
         runInAction(() => {
            if (this.activity) {
               this.activity.attendees.push(attendee);
               this.activity.isGoing = true;
               this.activityRegistry.set(this.activity.id, this.activity);
            }
         });
      } catch (error) {
         toast.error('Problem signing up to activity');
      } finally {
         runInAction(() => this.loading = false);
      }
   };

   @action cancelAttendance = async () => {
      this.loading = true;
      try {
         await agent.Activities.unattend(this.activity!.id);
         runInAction(() => {
            if (this.activity) {
               this.activity.attendees = this.activity.attendees.filter(
                  a => a.username != this.rootStore.userStore.user!.username
               );
               this.activity.isGoing = false;
               this.activityRegistry.set(this.activity.id, this.activity);
            }
         });
      } catch (error) {
         toast.error('Problem cancelling attendance');
      } finally {
         runInAction(() => this.loading = false);
      }
   };
}
