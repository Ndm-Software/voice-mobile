import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpAuthRepository } from './http-auth-repository';

const endpoints = {
  login: '/auth/login',
  authMe: '/auth/me',
  register: '/auth/register',
  google: '/auth/google',
  passwordForgot: '/auth/password/forgot',
  passwordReset: '/auth/password/reset',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
};

describe('HttpAuthRepository', () => {
  it('backend token-only login responseunu JWT sub/exp ve cihaz bilgisiyle eşler', async () => {
    const userId = '6bfbe9b4-8ce0-4f39-a2c1-417b4ab7ca7c';
    const tokenPayload =
      'eyJzdWIiOiI2YmZiZTliNC04Y2UwLTRmMzktYTJjMS00MTdiNGFiN2NhN2MiLCJleHAiOjQxMDI0NDQ4MDB9';
    const accessToken = `eyJhbGciOiJub25lIn0.${tokenPayload}.signature`;
    const refreshToken = `eyJhbGciOiJub25lIn0.${tokenPayload}.signature`;
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({ accessToken, refreshToken }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints, async () => ({
      installationId: '2d931510-3d4e-4bb1-b6ba-8a7c2c3a5d1e',
      platform: 'ANDROID',
      deviceName: 'Genymotion',
    }));

    await expect(
      repository.login({ email: 'ugur@example.com', password: 'Voia1234!' }),
    ).resolves.toMatchObject({
      userId,
      accessToken,
      refreshToken,
      phoneVerified: true,
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      '/auth/login',
      {
        email: 'ugur@example.com',
        password: 'Voia1234!',
        installationId: '2d931510-3d4e-4bb1-b6ba-8a7c2c3a5d1e',
        platform: 'ANDROID',
        deviceName: 'Genymotion',
      },
      { signal: undefined },
    );
  });

  it('/auth/me profilinden gerçek telefon doğrulama durumunu sessiona taşır', async () => {
    const session = {
      userId: '6bfbe9b4-8ce0-4f39-a2c1-417b4ab7ca7c',
      phoneVerified: true,
      accessToken: 'access',
      refreshToken: 'refresh',
      accessTokenExpiresAt: '2099-08-14T10:00:00.000Z',
      refreshTokenExpiresAt: '2099-09-14T10:00:00.000Z',
    };
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue({
        userId: session.userId,
        phoneNumber: '+905551112233',
        phoneVerified: false,
      }),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await expect(repository.hydrateSession(session)).resolves.toMatchObject({
      userId: session.userId,
      phoneNumber: '+905551112233',
      phoneVerified: false,
    });
    expect(httpClient.get).toHaveBeenCalledWith('/auth/me', { signal: undefined });
  });

  it('legacy snake_case login DTO alanlarını session modeline çevirir', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        user_id: 1001,
        access_token: 'access',
        refresh_token: 'refresh',
        access_token_expires_at: '2026-08-03T10:00:00+03:00',
        refresh_token_expires_at: '2026-09-03T10:00:00+03:00',
      }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await expect(
      repository.login({ email: 'ugur@example.com', password: 'Voia1234!' }),
    ).resolves.toEqual({
      userId: '1001',
      phoneVerified: true,
      accessToken: 'access',
      refreshToken: 'refresh',
      accessTokenExpiresAt: '2026-08-03T10:00:00+03:00',
      refreshTokenExpiresAt: '2026-09-03T10:00:00+03:00',
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'ugur@example.com', password: 'Voia1234!' },
      { signal: undefined },
    );
  });

  it('forgot/reset payloadlarını yalnız HTTP adapter üzerinden gönderir', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({}),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await repository.requestPasswordReset('ugur@example.com');
    await repository.resetPassword({ password: 'Guclu123', token: 'reset-token' });

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/auth/password/forgot',
      { email: 'ugur@example.com' },
      { signal: undefined },
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/auth/password/reset',
      { password: 'Guclu123', token: 'reset-token' },
      { signal: undefined },
    );
  });

  it('cookie-only backend cevabını mobil session sözleşmesi eksik olarak işaretler', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({ message: 'Login successful.' }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await expect(
      repository.login({ email: 'ugur@example.com', password: 'Voia1234!' }),
    ).rejects.toMatchObject({ code: 'AUTH_MOBILE_SESSION_UNSUPPORTED' });
  });

  it('kayıt payloadını backend camelCase sözleşmesine çevirir', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        message: 'Doğrulama kodu gönderildi.',
        expiresInSeconds: 600,
      }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await expect(
      repository.register({
        firstName: 'Selin',
        lastName: 'Aydın',
        email: 'selin@example.com',
        phoneNumber: '+905551112233',
        password: 'Guclu123',
      }),
    ).resolves.toMatchObject({
      kind: 'verification-required',
      pending: {
        email: 'selin@example.com',
        phoneNumber: '+905551112233',
      },
    });
    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/auth/register',
      {
        firstName: 'Selin',
        lastName: 'Aydın',
        email: 'selin@example.com',
        phoneNumber: '+905551112233',
        password: 'Guclu123',
      },
      { signal: undefined },
    );
  });
});
