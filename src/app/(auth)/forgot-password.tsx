import { appContainer } from '@/composition/app-container';
import { ForgotPasswordScreen } from '@/features/auth/presentation/forgot-password-screen';

export default function ForgotPasswordRoute() {
  return <ForgotPasswordScreen requestPasswordReset={appContainer.requestPasswordReset} />;
}
