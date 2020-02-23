import { RootStore } from './rootStore';
import { action, observable, runInAction, computed, reaction } from 'mobx';
import { IProfile, IPhoto, IUserActivity } from '../models/profile';
import agent from '../api/agent';
import { toast } from 'react-toastify';

export default class ProfileStore {
   rootStore: RootStore;

   constructor(rootStore: RootStore) {
      this.rootStore = rootStore;

      reaction (
         () => this.activeTab,
         activeTab => {
            if (activeTab === 3 || activeTab === 4) {
               const predicate = activeTab === 3 ? 'followers' : 'following';
               this.loadFollowings(predicate);
            } else {
               this.followings = [];
            }
         }
      )
   }

   @observable profile: IProfile | null = null;
   @observable loadingProfile = true;
   @observable uploadingPhoto = false;
   @observable loading = false;
   @observable followings: IProfile[] = [];
   @observable activeTab: number = 0;
   @observable userActivities: IUserActivity[] = [];
   @observable loadingActivities: boolean = false;

   @computed get isCurrentUser() {
      if (this.rootStore.userStore.user && this.profile)
         return (
            this.rootStore.userStore.user.username === this.profile.username
         );
      else return false;
   }

   @action loadUserActivities = async (username: string, predicate?: string) => {
      this.loadingActivities = true;
      try {
         const activities = await agent.Profiles.listActivities(username, predicate!);
         runInAction(() => this.userActivities = activities);
      } catch (error) {
         toast.error('Problem loading activities')
      } finally {
         runInAction(() => this.loadingActivities = false);
      }
   }

   @action loadProfile = async (username: string) => {
      this.loadingProfile = true;
      try {
         const profile = await agent.Profiles.get(username);
         runInAction(() => {
            this.profile = profile;
         });
      } catch (error) {
         console.log(error);
      } finally {
         runInAction(() => {
            this.loadingProfile = false;
         });
      }
   };

   @action uploadPhoto = async (file: Blob) => {
      this.uploadingPhoto = true;
      try {
         const photo = await agent.Profiles.uploadPhoto(file);
         runInAction(() => {
            if (this.profile) {
               this.profile.photos.push(photo);
               if (photo.isMain && this.rootStore.userStore.user) {
                  this.rootStore.userStore.user.image = photo.url;
                  this.profile.image = photo.url;
               }
            }
         });
      } catch (error) {
         console.log(error);
         toast.error('Problem uploading photo');
      } finally {
         runInAction(() => {
            this.uploadingPhoto = false;
         });
      }
   };

   @action setMainPhoto = async (photo: IPhoto) => {
      this.loading = true;
      try {
         await agent.Profiles.setMainPhoto(photo.id);
         runInAction(() => {
            this.rootStore.userStore.user!.image = photo.url;
            this.profile!.photos.find(a => a.isMain)!.isMain = false;
            this.profile!.photos.find(a => a.id === photo.id)!.isMain = true;
            this.profile!.image = photo.url;
         });
      } catch (error) {
         console.log(error);
         toast.error('Problem setting photo as main');
      } finally {
         runInAction(() => {
            this.loading = false;
         });
      }
   };

   @action deletePhoto = async (photo: IPhoto) => {
      this.loading = true;
      try {
         await agent.Profiles.deletePhoto(photo.id);
         runInAction(() => {
            this.profile!.photos = this.profile!.photos.filter(
               a => a.id !== photo.id
            );
         });
      } catch (error) {
         console.log(error);
         toast.error('Problem deleting photo');
      } finally {
         runInAction(() => {
            this.loading = false;
         });
      }
   };

   @action editProfile = async (profile: IProfile) => {
      this.loading = true;
      try {
         console.log(profile!.bio);
         await agent.Profiles.update(profile);
         runInAction('editing profile', () => {
            this.profile = profile;
            this.rootStore.userStore.user!.displayName = profile.displayName;
         });
      } catch (error) {
         toast.error('Problem submitting data');
         console.log(error.response);
      } finally {
         runInAction('editing profile finally', () => {
            this.loading = false;
         });
      }
   };

   @action follow = async (username: string) => {
      this.loading = true;
      try {
         await agent.Profiles.follow(username);
         runInAction(() => {
            this.profile!.following = true;
            this.profile!.followersCount++;
         })
      } catch (error) {
         toast.error('Problem following');
      } finally {
         runInAction('following user finally', () => {
            this.loading = false;
         });
      }
   };

   @action unfollow = async (username: string) => {
      this.loading = true;
      try {
         await agent.Profiles.unfollow(username);
         runInAction(() => {
            this.profile!.following = false;
            this.profile!.followersCount--;
         })
      } catch (error) {
         toast.error('Problem unfollowing');
      } finally {
         runInAction('Unfollowing user finally', () => {
            this.loading = false;
         });
      }
   };

   @action loadFollowings = async (predicate: string) => {
      this.loading = true;
      try {
         const profiles = await agent.Profiles.listFollowings(this.profile!.username, predicate);
         runInAction(() => {
            this.followings = profiles;
         })
      } catch (error) {
         toast.error('Problem loading followings');
      } finally {
         runInAction('Loading followings user finally', () => {
            this.loading = false;
         });
      }
   }

   @action setActiveTab = async (activeIndex: number) => {
      this.activeTab = activeIndex;
   }
}
