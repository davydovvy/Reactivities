import { observable, action, computed, runInAction, reaction } from 'mobx';
import { SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';
import { history } from '../..';
import { toast } from 'react-toastify';
import { RootStore } from './rootStore';
import { setActivityProps, createAttendee } from '../common/util/util';
import {
   HubConnection,
   HubConnectionBuilder,
   LogLevel
} from '@microsoft/signalr';

const LIMIT = 2;

export default class ActivityStore {
   rootStore: RootStore;
   constructor(rootStore: RootStore) {
      this.rootStore = rootStore;

      reaction (
         () => this.predicate.keys(),
         () => {
            this.page = 0;
            this.activityRegistry.clear();
            this.loadActivities();
         }
      )
   }

   @observable activityRegistry = new Map();
   @observable activity: IActivity | null = null;
   @observable loadingInitial = false;
   @observable submitting = false;
   @observable targetButton = '';
   @observable loading = false;
   @observable.ref hubConnection: HubConnection | null = null;
   @observable activityCount = 0;
   @observable page = 0;
   @observable predicate = new Map();

   @action setPredicate = (predicate: string, value: string | Date) => {
      this.predicate.clear();
      if (predicate !== 'all') {
         this.predicate.set(predicate, value);
      }
   }

   @computed get axiosParams() {
      const params = new URLSearchParams();
      params.append('limit', String(LIMIT));
      params.append('offset', `${this.page ? this.page * LIMIT : 0}`);
      this.predicate.forEach((value, key) => {
         if (key === 'startDate')
            params.append(key, value.toISOString())
         else
            params.append(key, value)
      })
      return params;
   }

   @computed get totalPages() {
      return Math.ceil(this.activityCount / LIMIT)
   }

   @action setPage = (page: number) => {
      this.page = page
   }

   @action createHubConnection = (activityId: string) => {
      this.hubConnection = new HubConnectionBuilder()
         .withUrl('http://localhost:5000/chat', {
            accessTokenFactory: () => this.rootStore.commonStore.token!
         })
         .configureLogging(LogLevel.Information)
         .build();

      this.hubConnection
         .start()
         .then(() => console.log(this.hubConnection!.state))
         .then(() => {               
            console.log('Attempting to join group');
            this.hubConnection!.invoke('AddToGroup', activityId);
         })
         .catch(error => console.log('Error establishing connection: ', error));

      this.hubConnection.on('ReceiveComment', comment => {
         runInAction(() => {
            this.activity!.comments.push(comment);
         });
      });

      this.hubConnection.on('Send', message => {
         toast.info(message);
      });
   };

   @action stopHubConnection = () => {
      this.hubConnection!.invoke('RemoveFromGroup', this.activity!.id).then(
         () => {
            this.hubConnection!.stop();
         }
      ).then(() => console.log('Connection stopped')).catch(error => console.log(error));
   };

   @action addComment = async (values: any) => {
      values.activityId = this.activity!.id;
      try {
         await this.hubConnection!.invoke('SendComment', values);
      } catch (error) {
         console.log(error);
      }
   };

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
         const activitiesEnvelope = await agent.Activities.list(this.axiosParams);
         const {activities, activityCount} = activitiesEnvelope;
         runInAction('loading activities', () => {
            activities.forEach(activity => {
               setActivityProps(activity, user!);
               this.activityRegistry.set(activity.id, activity);
            });
            this.activityCount = activityCount;
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
         activity.comments = [];
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
         runInAction(() => (this.loading = false));
      }
   };

   @action cancelAttendance = async () => {
      this.loading = true;
      try {
         await agent.Activities.unattend(this.activity!.id);
         runInAction(() => {
            if (this.activity) {
               this.activity.attendees = this.activity.attendees.filter(
                  a => a.username !== this.rootStore.userStore.user!.username
               );
               this.activity.isGoing = false;
               this.activityRegistry.set(this.activity.id, this.activity);
            }
         });
      } catch (error) {
         toast.error('Problem cancelling attendance');
      } finally {
         runInAction(() => (this.loading = false));
      }
   };
}
