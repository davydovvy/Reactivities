import React, { useContext, useState } from 'react';
import { Tab, Header, Card, Image, Button, Grid } from 'semantic-ui-react';
import { RootStoreContext } from '../../app/stores/rootStore';
import PhotoUploadWidget from '../../app/common/photoUpload/PhotoUploadWidget';
import { observer } from 'mobx-react-lite';

const ProfilePhotos = () => {
   const rootStore = useContext(RootStoreContext);
   const {
      profile,
      isCurrentUser,
      uploadPhoto,
      uploadingPhoto,
      setMainPhoto,
      deletePhoto,
      loading
   } = rootStore.profileStore;
   const [addPhotoMode, setAddPhotoMode] = useState(false);
   const [targetButton, setTargetButton] = useState<string | undefined>(
      undefined
   );
   const [targetDeleteButton, setTargetDeleteButton] = useState<
      string | undefined
   >(undefined);

   const handleUploadImage = (photo: Blob) => {
      uploadPhoto(photo).then(() => setAddPhotoMode(false));
   };

   return (
      <Tab.Pane>
         <Grid>
            <Grid.Column width={16} style={{ paddingBottom: 0 }}>
               <Header floated="left" icon="image" content="Photos" />
               {isCurrentUser && (
                  <Button
                     floated="right"
                     basic
                     content={addPhotoMode ? 'Cancel' : 'Add Photo'}
                     onClick={() => setAddPhotoMode(!addPhotoMode)}
                  />
               )}
            </Grid.Column>
            <Grid.Column width={16}>
               {addPhotoMode ? (
                  <PhotoUploadWidget
                     uploadPhoto={handleUploadImage}
                     loading={uploadingPhoto}
                  />
               ) : (
                  <Card.Group itemsPerRow={5}>
                     {profile &&
                        profile.photos.map(photo => (
                           <Card key={photo.id}>
                              <Image src={photo.url} />
                              {isCurrentUser && (
                                 <Button.Group fluid widths={2}>
                                    <Button
                                       name={photo.id}
                                       basic
                                       positive
                                       content="Main"
                                       onClick={event => {
                                          setTargetButton(
                                             event.currentTarget.name
                                          );
                                          setMainPhoto(photo);
                                       }}
                                       loading={
                                          loading && targetButton === photo.id
                                       }
                                       disabled={photo.isMain}
                                    />
                                    <Button
                                       name={photo.id}
                                       disabled={photo.isMain}
                                       onClick={(event) => {
                                          deletePhoto(photo);
                                          setTargetDeleteButton(event.currentTarget.name);
                                       }}
                                       loading={loading && targetDeleteButton === photo.id}
                                       basic
                                       negative
                                       icon="trash"
                                    />
                                 </Button.Group>
                              )}
                           </Card>
                        ))}
                  </Card.Group>
               )}
            </Grid.Column>
         </Grid>
      </Tab.Pane>
   );
};

export default observer(ProfilePhotos);
