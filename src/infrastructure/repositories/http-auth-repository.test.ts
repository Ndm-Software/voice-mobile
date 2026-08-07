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
  it('snake_case login DTO alanlarını session modeline çevirir', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        user_id: 1001,
        access_token: 'access',
        refresh_token: 'refresh',
        access_token_expires_at: '2026-08-03T10:00:00+03:00',
        refresh_token_expires_at: '2026-09-03T10:00:00+03:00',
      }),
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

  it('kayıt ve Google credential payloadlarını backend sözleşmesine çevirir', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        user_id: '1002',
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        access_token_expires_at: '2026-08-03T10:00:00+03:00',
        refresh_token_expires_at: '2026-09-03T10:00:00+03:00',
      }),
    };
    const repository = new HttpAuthRepository(httpClient, endpoints);

    await repository.register({
      firstName: 'Selin',
      lastName: 'Aydın',
      email: 'selin@example.com',
      phoneNumber: '+905551112233',
      password: 'Guclu123',
    });
    await repository.exchangeGoogleCredential({ provider: 'google', idToken: 'google-token' });

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/auth/register',
      {
        first_name: 'Selin',
        last_name: 'Aydın',
        email: 'selin@example.com',
        phone_number: '+905551112233',
        password: 'Guclu123',
      },
      { signal: undefined },
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/auth/google',
      { provider: 'google', id_token: 'google-token' },
      { signal: undefined },
    );
  });
});
