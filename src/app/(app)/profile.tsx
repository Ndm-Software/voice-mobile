import { appContainer } from '@/composition/app-container';
import { ProfileScreen } from '@/features/profile/presentation/profile-screen';

export default function ProfileRoute() {
  return (
    <ProfileScreen
      getProfile={appContainer.getProfile}
      updateProfile={appContainer.updateProfile}
    />
  );
}
