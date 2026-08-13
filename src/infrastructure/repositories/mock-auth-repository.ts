import type { Session } from '@/domain/models/session';
import {
  AuthRequestError,
  type AuthRepository,
  type GoogleCredential,
  type LoginCredentials,
  type PasswordResetInput,
  type RegisterInput,
} from '@/domain/repositories/auth-repository';
import { MockAuthAccountStore } from '@/infrastructure/mock/auth/mock-auth-account-store';
import { MockNetwork } from '@/infrastructure/mock/mock-network';
import type { KeyValueStorage } from '@/core/storage/key-value-storage';

export const MOCK_LOGIN_EMAIL = 'ugur@example.com';
export const MOCK_LOGIN_PASSWORD = 'Voia1234!';
export const MOCK_PASSWORD_RESET_TOKEN = 'mock-password-reset-token';

class InMemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.values.get(key) ?? null);
  }

  setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    this.values.delete(key);
    return Promise.resolve();
  }
}

export class MockAuthRepository implements AuthRepository {
  private readonly accountStore: MockAuthAccountStore;

  constructor(
    private readonly network: MockNetwork,
    private readonly now: () => Date = () => new Date(),
    accountStore?: MockAuthAccountStore,
  ) {
    this.accountStore = accountStore ?? new MockAuthAccountStore(new InMemoryStorage());
  }

  login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Session> {
    return this.network.run(async () => {
      const account = await this.accountStore.findByEmail(credentials.email);
      if (!account || !(await this.accountStore.verifyPassword(account, credentials.password))) {
        throw new AuthRequestError('INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.', {
          form: 'E-posta veya şifre hatalı.',
        });
      }

      return this.createSession(account.userId, account.phoneNumber, account.phoneVerified);
    }, signal);
  }

  register(input: RegisterInput, signal?: AbortSignal): Promise<Session> {
    return this.network.run(async () => {
      const account = await this.accountStore.register(input);
      return this.createSession(account.userId, account.phoneNumber, account.phoneVerified);
    }, signal);
  }

  refreshSession(session: Session, signal?: AbortSignal): Promise<Session> {
    return this.network.run(
      () =>
        this.createSession(
          session.userId,
          session.phoneNumber ?? '',
          session.phoneVerified ?? true,
        ),
      signal,
    );
  }

  logoutSession(_session: Session, signal?: AbortSignal): Promise<void> {
    return this.network.run(() => undefined, signal);
  }

  hydrateSession(session: Session, signal?: AbortSignal): Promise<Session> {
    return this.network.run(() => session, signal);
  }

  exchangeGoogleCredential(_credential: GoogleCredential, signal?: AbortSignal): Promise<Session> {
    return this.network.run(() => {
      throw new AuthRequestError(
        'GOOGLE_NOT_CONFIGURED',
        'Google ile giriş, native sağlayıcı ve backend hazır olduğunda etkinleşecek.',
        { form: 'Google ile giriş henüz yapılandırılmadı.' },
      );
    }, signal);
  }

  requestPasswordReset(email: string, signal?: AbortSignal) {
    return this.network.run(async () => {
      const account = await this.accountStore.findByEmail(email);
      if (account) {
        await this.accountStore.issueResetToken(MOCK_PASSWORD_RESET_TOKEN, account.userId);
      }
      return { previewToken: MOCK_PASSWORD_RESET_TOKEN };
    }, signal);
  }

  resetPassword(input: PasswordResetInput, signal?: AbortSignal): Promise<void> {
    return this.network.run(
      () => this.accountStore.resetPassword(input.token, input.password),
      signal,
    );
  }

  private createSession(userId: string, phoneNumber: string, phoneVerified: boolean): Session {
    const now = this.now();

    return {
      userId,
      phoneNumber,
      phoneVerified,
      accessToken: `mock-access-${now.getTime()}`,
      refreshToken: `mock-refresh-${now.getTime()}`,
      accessTokenExpiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
