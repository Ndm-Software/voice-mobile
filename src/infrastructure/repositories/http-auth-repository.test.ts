import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpAuthRepository } from './http-auth-repository';

const endpoints = {
  login: '/auth/login',
  register: '/auth/register',
  google: '/auth/google',
  passwordForgot: '/auth/password/forgot',
  passwordReset: '/auth/password/reset',
};

describe('HttpAuthRepository', () => {
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
        user_id: '1002',
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        access_token_expires_at: '2026-08-03T10:00:00+03:00',
        refresh_token_expires_at: '2026-09-03T10:00:00+03:00',
      }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await repository.register({
      firstName: 'Selin',
      lastName: 'Aydın',
      email: 'selin@example.com',
      phoneNumber: '+905551112233',
      password: 'Guclu123',
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
