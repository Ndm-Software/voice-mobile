import { useLocalSearchParams } from 'expo-router';

import { appContainer } from '@/composition/app-container';
import { ResetPasswordScreen } from '@/features/auth/presentation/reset-password-screen';

export default function ResetPasswordRoute() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();

  return (
    <ResetPasswordScreen
      resetPassword={appContainer.resetPassword}
      token={typeof token === 'string' ? token : ''}
    />
  );
}
