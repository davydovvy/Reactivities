import { observable, computed, action, runInAction } from 'mobx';
import { IUser, IUserFormValues } from '../models/user';
import agent from '../api/agent';
import { RootStore } from './rootStore';
import { history } from '../..';

export default class UserStore {
   rootStore: RootStore;
   constructor(rootStore: RootStore) {
      this.rootStore = rootStore;
   }

   @observable user: IUser | null = null;

   @computed get isLoggedIn() {
      return !!this.user;
   }

   @action login = async (values: IUserFormValues) => {
      try {
         const loggedUser = await agent.User.login(values);
         runInAction(() => {
            this.user = loggedUser;
         });
         this.rootStore.commonStore.setToken(loggedUser.token);
         this.rootStore.modalStore.closeModal();
         history.push('/activities');
      } catch (error) {
         throw error;
      }
   };

   @action register = async (values: IUserFormValues) => {
      try {
         const registeredUser = await agent.User.register(values);
         this.rootStore.commonStore.setToken(registeredUser.token);
         this.rootStore.modalStore.closeModal();
         history.push('/activities');
      } catch (error) {
         throw error;
      }
   }

   @action getUser = async () => {
      try {
         const user = await agent.User.current();
         runInAction(() => {
            this.user = user;
         })
      } catch (error) {
         console.log(error);
      }
   }

   @action logout = () => {
      this.rootStore.commonStore.setToken(null);
      this.user = null;
      history.push('/');
   }
}
