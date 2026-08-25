import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { Login, Register, RequestPasswordReset, ResetPassword } from '@/application/auth';
import type { Session } from '@/domain/models/session';
import { AuthRequestError } from '@/domain/repositories/auth-repository';
import { renderWithProviders } from '@/test/render-with-providers';

import { ForgotPasswordScreen } from './forgot-password-screen';
import { LoginScreen } from './login-screen';
import { ResetPasswordScreen } from './reset-password-screen';
import { RegisterScreen } from './register-screen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSignIn = jest.fn(async () => undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('@/application/session', () => ({
  useSession: () => ({ signIn: mockSignIn }),
}));

const session: Session = {
  userId: '1001',
  accessToken: 'access',
  refreshToken: 'refresh',
  accessTokenExpiresAt: '2026-08-03T12:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-03T12:00:00.000Z',
};

describe('7. gün auth ekranları', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('login alan ve API hatalarını gösterir', async () => {
    const login: Login = {
      execute: jest.fn(async () => {
        throw new AuthRequestError('INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.', {
          form: 'E-posta veya şifre hatalı.',
        });
      }),
    };
    await renderWithProviders(<LoginScreen login={login} />);

    await fireEvent.changeText(screen.getByLabelText('E-posta adresi'), 'ugur@example.com');
    await fireEvent.changeText(screen.getByLabelText('Şifre'), 'yanlış');
    await fireEvent.press(screen.getByRole('button', { name: 'Giriş yap' }));

    expect(await screen.findByText('E-posta veya şifre hatalı.')).toBeTruthy();
  });

  it('başarılı girişte session kaydeder; yönlendirmeyi SessionGate yönetir', async () => {
    const login: Login = { execute: jest.fn(async () => session) };
    await renderWithProviders(<LoginScreen login={login} />);

    await fireEvent.changeText(screen.getByLabelText('E-posta adresi'), 'ugur@example.com');
    await fireEvent.changeText(screen.getByLabelText('Şifre'), 'Voia1234!');
    await fireEvent.press(screen.getByRole('button', { name: 'Giriş yap' }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith(session));
    expect(mockReplace).not.toHaveBeenCalledWith('/home');
  });

  it('Google giriş seçeneğini backend akışını tetiklemeden gösterir', async () => {
    const login: Login = { execute: jest.fn(async () => session) };
    await renderWithProviders(<LoginScreen login={login} />);

    const googleButton = screen.getByRole('button', { name: 'Google ile devam et' });

    expect(googleButton.props.accessibilityState).toEqual({ disabled: true });
    await fireEvent.press(googleButton);
    expect(login.execute).not.toHaveBeenCalled();
  });

  it('Google kayıt seçeneğini backend akışını tetiklemeden gösterir', async () => {
    const register: Register = {
      execute: jest.fn(async () => ({ kind: 'authenticated' as const, session })),
    };
    await renderWithProviders(<RegisterScreen register={register} />);

    const googleButton = screen.getByRole('button', { name: 'Google ile kayıt ol' });

    expect(googleButton.props.accessibilityState).toEqual({ disabled: true });
    await fireEvent.press(googleButton);
    expect(register.execute).not.toHaveBeenCalled();
  });

  it('şifremi unuttum akışında enumeration-safe sonucu ve demo bağlantısını gösterir', async () => {
    const requestPasswordReset: RequestPasswordReset = {
      execute: jest.fn(async () => ({ previewToken: 'preview-token' })),
    };
    await renderWithProviders(<ForgotPasswordScreen requestPasswordReset={requestPasswordReset} />);

    await fireEvent.changeText(screen.getByLabelText('E-posta adresi'), 'ugur@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Yenileme bağlantısı gönder' }));

    expect(await screen.findByText('E-postanı kontrol et')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Şifre yenilemeye devam et' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/reset-password',
      params: { token: 'preview-token' },
    });
  });

  it('yeni şifreyi kaydedip giriş ekranına döner', async () => {
    const resetPassword: ResetPassword = { execute: jest.fn(async () => undefined) };
    await renderWithProviders(
      <ResetPasswordScreen resetPassword={resetPassword} token="preview-token" />,
    );

    await fireEvent.changeText(screen.getByLabelText('Yeni şifre'), 'Guclu123');
    await fireEvent.changeText(screen.getByLabelText('Yeni şifre tekrar'), 'Guclu123');
    await fireEvent.press(screen.getByRole('button', { name: 'Şifreyi yenile' }));

    await waitFor(() =>
      expect(resetPassword.execute).toHaveBeenCalledWith('preview-token', 'Guclu123', 'Guclu123'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('kayıt formunda alanları doğrular ve geçerli session üretir', async () => {
    const register: Register = {
      execute: jest.fn(async (firstName) => {
        if (!firstName) {
          throw new AuthRequestError('VALIDATION_ERROR', 'Lütfen alanları kontrol edin.', {
            firstName: 'Ad zorunludur.',
          });
        }
        return { kind: 'authenticated' as const, session };
      }),
    };
    await renderWithProviders(<RegisterScreen register={register} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Kayıt ol' }));
    expect(await screen.findByText('Ad zorunludur.')).toBeTruthy();
    expect(register.execute).toHaveBeenCalledWith('', '', '', '', '', '');

    await fireEvent.changeText(screen.getByLabelText('Ad'), 'Selin');
    await fireEvent.changeText(screen.getByLabelText('Soyad'), 'Aydın');
    await fireEvent.changeText(screen.getByLabelText('E-posta adresi'), 'selin@example.com');
    await fireEvent.changeText(screen.getByLabelText('Telefon numarası'), '+905551112233');
    await fireEvent.changeText(screen.getByLabelText('Şifre'), 'Guclu123');
    await fireEvent.changeText(screen.getByLabelText('Şifre tekrar'), 'Guclu123');
    await fireEvent.press(screen.getByRole('button', { name: 'Kayıt ol' }));

    await waitFor(() =>
      expect(register.execute).toHaveBeenCalledWith(
        'Selin',
        'Aydın',
        'selin@example.com',
        '+905551112233',
        'Guclu123',
        'Guclu123',
      ),
    );
    expect(mockSignIn).toHaveBeenCalledWith(session);
    expect(mockReplace).not.toHaveBeenCalledWith('/home');
  });

  it('API kaydında OTP bekleyen durumu açıp doğrulama ekranına gider', async () => {
    const register: Register = {
      execute: jest.fn(async () => ({
        kind: 'verification-required' as const,
        pending: {
          email: 'selin@example.com',
          phoneNumber: '+905559998877',
          expiresAt: '2099-01-01T00:10:00.000Z',
          resendAvailableAt: '2099-01-01T00:01:00.000Z',
        },
      })),
    };
    await renderWithProviders(<RegisterScreen register={register} />);

    await fireEvent.changeText(screen.getByLabelText('Ad'), 'Selin');
    await fireEvent.changeText(screen.getByLabelText('Soyad'), 'Aydın');
    await fireEvent.changeText(screen.getByLabelText('E-posta adresi'), 'selin@example.com');
    await fireEvent.changeText(screen.getByLabelText('Telefon numarası'), '+905559998877');
    await fireEvent.changeText(screen.getByLabelText('Şifre'), 'Guclu123');
    await fireEvent.changeText(screen.getByLabelText('Şifre tekrar'), 'Guclu123');
    await fireEvent.press(screen.getByRole('button', { name: 'Kayıt ol' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/verify-phone'));
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
