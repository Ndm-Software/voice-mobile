import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { RequestPhoneVerification, VerifyPhone } from '@/application/auth';
import type { Session } from '@/domain/models/session';
import { renderWithProviders } from '@/test/render-with-providers';

import { PhoneVerificationScreen } from './phone-verification-screen';

const mockSignIn = jest.fn(async () => undefined);
const session: Session = {
  userId: 'user-1',
  phoneNumber: '+905551112233',
  phoneVerified: false,
  accessToken: 'access',
  refreshToken: 'refresh',
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiresAt: '2099-02-01T00:00:00.000Z',
};

jest.mock('@/application/session', () => ({
  useSession: () => ({ session, signIn: mockSignIn }),
}));

describe('9. gün telefon doğrulama ekranı', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('doğrulama kodunu gösterir ve başarılı doğrulamada session durumunu günceller', async () => {
    const requestPhoneVerification: RequestPhoneVerification = {
      execute: jest.fn(async () => ({
        id: 'challenge-1',
        maskedPhoneNumber: '+90 ••• ••• •• 33',
        expiresAt: '2099-01-01T00:05:00.000Z',
        resendAvailableAt: '2000-01-01T00:00:00.000Z',
        remainingAttempts: 5,
        maxAttempts: 5,
        developmentCode: '123456',
      })),
    };
    const verifyPhone: VerifyPhone = { execute: jest.fn(async () => undefined) };

    await renderWithProviders(
      <PhoneVerificationScreen
        requestPhoneVerification={requestPhoneVerification}
        verifyPhone={verifyPhone}
      />,
    );

    expect(await screen.findByText('Doğrulama kodun')).toBeTruthy();
    expect(screen.getByText('123456')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '123456');
    await fireEvent.press(screen.getByRole('button', { name: 'Telefonu doğrula' }));

    await waitFor(() =>
      expect(verifyPhone.execute).toHaveBeenCalledWith('user-1', 'challenge-1', '123456'),
    );
    expect(mockSignIn).toHaveBeenCalledWith({ ...session, phoneVerified: true });
  });
});
