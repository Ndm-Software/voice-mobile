import { appContainer } from '@/composition/app-container';
import { LoginScreen } from '@/features/auth/presentation/login-screen';

export default function LoginRoute() {
  return <LoginScreen login={appContainer.login} />;
}
