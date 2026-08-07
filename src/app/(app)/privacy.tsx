import { appContainer } from '@/composition/app-container';
import { PrivacyScreen } from '@/features/privacy/presentation/privacy-screen';

export default function PrivacyRoute() {
  return <PrivacyScreen deleteAccount={appContainer.deleteAccount} />;
}
