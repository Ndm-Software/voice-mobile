import { MockNetwork } from '@/infrastructure/mock/mock-network';
import type { KeyValueStorage } from '@/core/storage/key-value-storage';

import {
  MOCK_AUTH_STORAGE_KEY,
  MockAuthAccountStore,
  type PasswordHasher,
} from '@/infrastructure/mock/auth/mock-auth-account-store';
import {
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_PASSWORD,
  MOCK_PASSWORD_RESET_TOKEN,
  MockAuthRepository,
} from './mock-auth-repository';

function createRepository() {
  const storage = new MemoryStorage();
  const hasher: PasswordHasher = { hash: async (value) => `hash:${value}` };
  return new MockAuthRepository(
    new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    () => new Date('2026-08-03T09:00:00.000Z'),
    new MockAuthAccountStore(storage, hasher),
  );
}

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('MockAuthRepository', () => {
  it('SecureStore auth anahtarı geçerli karakter sözleşmesine uyar', () => {
    expect(MOCK_AUTH_STORAGE_KEY).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  it('demo hesapla güvenli session üretir', async () => {
    await expect(
      createRepository().login({ email: MOCK_LOGIN_EMAIL, password: MOCK_LOGIN_PASSWORD }),
    ).resolves.toEqual({
      userId: '1001',
      phoneNumber: '+905551112233',
      phoneVerified: true,
      accessToken: 'mock-access-1785747600000',
      refreshToken: 'mock-refresh-1785747600000',
      accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
      refreshTokenExpiresAt: '2026-09-02T09:00:00.000Z',
    });
  });

  it('yanlış kimlik bilgilerini güvenli genel hatayla reddeder', async () => {
    await expect(
      createRepository().login({ email: MOCK_LOGIN_EMAIL, password: 'yanlış' }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      fieldErrors: { form: 'E-posta veya şifre hatalı.' },
    });
  });

  it('enumeration-safe reset isteği ve tek kullanımlık demo token sınırını uygular', async () => {
    const repository = createRepository();

    await expect(repository.requestPasswordReset('kim@example.com')).resolves.toEqual({
      previewToken: MOCK_PASSWORD_RESET_TOKEN,
    });
    await expect(
      repository.resetPassword({ password: 'Guclu123', token: 'geçersiz' }),
    ).rejects.toMatchObject({ code: 'RESET_TOKEN_INVALID' });
    await expect(
      repository.resetPassword({ password: 'Guclu123', token: MOCK_PASSWORD_RESET_TOKEN }),
    ).resolves.toBeUndefined();
    await expect(
      repository.resetPassword({ password: 'Tekrar123', token: MOCK_PASSWORD_RESET_TOKEN }),
    ).rejects.toMatchObject({ code: 'RESET_TOKEN_INVALID' });
  });

  it('kayıt ve parola sıfırlama sonucunu kalıcı mock depoda kullanır', async () => {
    const repository = createRepository();

    await expect(
      repository.register({
        firstName: 'Selin',
        lastName: 'Aydın',
        email: 'selin@example.com',
        phoneNumber: '+905551112233',
        password: 'Guclu123',
      }),
    ).resolves.toMatchObject({
      userId: expect.stringContaining('mock-user-'),
      phoneNumber: '+905551112233',
      phoneVerified: false,
    });
    await expect(
      repository.login({ email: 'selin@example.com', password: 'Guclu123' }),
    ).resolves.toMatchObject({ userId: expect.stringContaining('mock-user-') });

    await repository.resetPassword({ password: 'YeniGuclu123', token: MOCK_PASSWORD_RESET_TOKEN });
    await expect(
      repository.login({ email: MOCK_LOGIN_EMAIL, password: MOCK_LOGIN_PASSWORD }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(
      repository.login({ email: MOCK_LOGIN_EMAIL, password: 'YeniGuclu123' }),
    ).resolves.toMatchObject({ userId: '1001' });
  });
});
