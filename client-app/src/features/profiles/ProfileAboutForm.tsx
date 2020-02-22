import React, { useContext, useState, useEffect } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import { combineValidators, isRequired } from 'revalidate';
import { RootStoreContext } from '../../app/stores/rootStore';
import { Form, Button } from 'semantic-ui-react';
import TextInput from '../../app/common/form/TextInput';
import TextAreaInput from '../../app/common/form/TextAreaInput';
import { ProfileFormValues } from '../../app/models/profile';
import { runInAction } from 'mobx';

const validate = combineValidators({
   displayName: isRequired({ message: 'Display name is required' }),
   bio: isRequired({ message: 'Biography is required' })
});

interface IProps {
   setEditMode: (editMode: boolean) => void;
}

const ProfileAboutForm:React.FC<IProps> = ({setEditMode}) => {
   const rootStore = useContext(RootStoreContext);
   const { profile, editProfile } = rootStore.profileStore;
   const [updatedProfile, setUpdatedProfile] = useState(new ProfileFormValues());
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      setLoading(true);
      runInAction('setting the profile', () => {
         setUpdatedProfile(new ProfileFormValues(profile!));
      });
      setLoading(false);
   }, [profile]);

   const handleFinalFormSubmit = (values: any) => {
      const {...profile} = values;
      editProfile(profile);
      setEditMode(false);
   };

   return (
      <FinalForm
         validate={validate}
         initialValues={updatedProfile}
         onSubmit={handleFinalFormSubmit}
         render={({ handleSubmit, invalid, pristine }) => (
            <Form onSubmit={handleSubmit} loading={loading}>
               <Field
                  name="displayName"
                  placeholder="DisplayName"
                  value={updatedProfile.displayName}
                  component={TextInput}
               />
               <Field
                  name="bio"
                  rows={3}
                  placeholder="Biography"
                  value={updatedProfile.bio}
                  component={TextAreaInput}
               />
               <Button
                  floated="right"
                  disabled={loading || invalid || pristine}
                  positive
                  type="submit"
                  content="Submit"
                  //loading={submitting}
               />
            </Form>
         )}
      />
   );
};

export default ProfileAboutForm;
