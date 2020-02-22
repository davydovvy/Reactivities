import React, { useContext, useState } from 'react';
import { Tab, Header, Button, Grid } from 'semantic-ui-react';
import { RootStoreContext } from '../../app/stores/rootStore';
import { observer } from 'mobx-react-lite';
import ProfileAboutForm from './ProfileAboutForm';

const ProfileAbout = () => {
   const rootStore = useContext(RootStoreContext);
   const { profile, isCurrentUser } = rootStore.profileStore;
   const [editMode, setEditMode] = useState(false);

   return (
      <Tab.Pane>
         <Grid>
            <Grid.Column width={16} style={{ paddingBottom: 0 }}>
               <Header
                  floated="left"
                  icon="user"
                  content={'About ' + profile!.displayName}
               />
               {isCurrentUser && (
                  <Button
                     floated="right"
                     basic
                     content={editMode ? 'Cancel' : 'Edit'}
                     onClick={() => setEditMode(!editMode)}
                  />
               )}
            </Grid.Column>
            <Grid.Column width={16}>
               {editMode ? <ProfileAboutForm setEditMode={setEditMode}/> : <div>{profile!.bio}</div>}
            </Grid.Column>
         </Grid>
      </Tab.Pane>
   );
};

export default observer(ProfileAbout);
