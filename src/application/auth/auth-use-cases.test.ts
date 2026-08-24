import type { Session } from '@/domain/models/session';
import type {
  AuthRepository,
  GoogleCredential,
  LoginCredentials,
  PasswordResetInput,
  RegisterInput,
} from '@/domain/repositories/auth-repository';

import { LoginUseCase } from './login';
import { ExchangeGoogleCredentialUseCase } from './exchange-google-credential';
import { RegisterUseCase } from './register';
import { RequestPasswordResetUseCase } from './request-password-reset';
import { ResetPasswordUseCase } from './reset-password';

const session: Session = {
  userId: '1001',
  accessToken: 'access',
  refreshToken: 'refresh',
  accessTokenExpiresAt: '2026-08-03T12:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-03T12:00:00.000Z',
};

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    login: jest.fn(async (_credentials: LoginCredentials, _signal?: AbortSignal) => session),
    register: jest.fn(async (_input: RegisterInput, _signal?: AbortSignal) => ({
      kind: 'authenticated' as const,
      session,
    })),
    exchangeGoogleCredential: jest.fn(
      async (_credential: GoogleCredential, _signal?: AbortSignal) => session,
    ),
    requestPasswordReset: jest.fn(async (_email: string, _signal?: AbortSignal) => ({})),
    resetPassword: jest.fn(async (_input: PasswordResetInput, _signal?: AbortSignal) => undefined),
  };
}

describe('auth use-case doğrulaması', () => {
  it('login e-postasını normalize edip repository çağırır', async () => {
    const repository = createRepository();
    const login = new LoginUseCase(repository);

    await expect(login.execute('  UGUR@EXAMPLE.COM ', 'Voia1234!')).resolves.toEqual(session);
    expect(repository.login).toHaveBeenCalledWith(
      { email: 'ugur@example.com', password: 'Voia1234!' },
      undefined,
    );
  });

  it('geçersiz login alanlarını repository çağırmadan döndürür', async () => {
    const repository = createRepository();
    const login = new LoginUseCase(repository);

    await expect(login.execute('hatalı', '')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: {
        email: 'Geçerli bir e-posta adresi girin.',
        password: 'Şifre zorunludur.',
      },
    });
    expect(repository.login).not.toHaveBeenCalled();
  });

  it('şifre sıfırlama isteğinde e-postayı doğrular ve normalize eder', async () => {
    const repository = createRepository();
    const requestReset = new RequestPasswordResetUseCase(repository);

    await requestReset.execute(' UGUR@EXAMPLE.COM ');
    expect(repository.requestPasswordReset).toHaveBeenCalledWith('ugur@example.com', undefined);
  });

  it('yeni şifrenin güvenlik ve eşleşme kurallarını uygular', async () => {
    const repository = createRepository();
    const reset = new ResetPasswordUseCase(repository);

    await expect(reset.execute('token', 'zayıf', 'farklı')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: expect.objectContaining({
        password: expect.any(String),
        passwordConfirmation: 'Şifreler eşleşmiyor.',
      }),
    });
    expect(repository.resetPassword).not.toHaveBeenCalled();

    await reset.execute('token', 'Guclu123', 'Guclu123');
    expect(repository.resetPassword).toHaveBeenCalledWith(
      { password: 'Guclu123', token: 'token' },
      undefined,
    );
  });

  it('kayıt alanlarını normalize edip güvenlik kurallarıyla repositorye verir', async () => {
    const repository = createRepository();
    const register = new RegisterUseCase(repository);

    await register.execute(
      ' Selin ',
      ' Aydın ',
      ' SELIN@EXAMPLE.COM ',
      '+90 555 111 22 33',
      'Guclu123',
      'Guclu123',
    );

    expect(repository.register).toHaveBeenCalledWith(
      {
        firstName: 'Selin',
        lastName: 'Aydın',
        email: 'selin@example.com',
        phoneNumber: '+905551112233',
        password: 'Guclu123',
      },
      undefined,
    );
  });

  it('Google credential boşsa native/backend sınırını çağırmadan durur', async () => {
    const repository = createRepository();
    const exchange = new ExchangeGoogleCredentialUseCase(repository);

    await expect(exchange.execute('')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { form: 'Google kimlik bilgisi alınamadı.' },
    });
    expect(repository.exchangeGoogleCredential).not.toHaveBeenCalled();
  });
});
