import { appContainer } from '@/composition/app-container';
import { PhoneVerificationScreen } from '@/features/auth/presentation/phone-verification-screen';

export default function VerifyPhoneRoute() {
  return (
    <PhoneVerificationScreen
      requestPhoneVerification={appContainer.requestPhoneVerification}
      verifyPhone={appContainer.verifyPhone}
    />
  );
}
