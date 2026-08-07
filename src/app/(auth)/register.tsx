import { appContainer } from '@/composition/app-container';
import { RegisterScreen } from '@/features/auth/presentation/register-screen';

export default function RegisterRoute() {
  return <RegisterScreen register={appContainer.register} />;
}
