import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

import { HttpUserRepository } from './http-user-repository';

describe('HttpUserRepository', () => {
  const endpoints = { profile: '/users/me', preferences: '/user-settings/me' };
  const userId = '6bfbe9b4-8ce0-4f39-a2c1-417b4ab7ca7c';
  const settingId = 'f3155220-fd98-4ce5-a7d6-77476dfc1c93';
  const languageId = '39a92239-8310-4e4f-aa77-f639a8bb95fb';

  it('backend camelCase profil response ve PATCH payloadını eşler', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn().mockResolvedValue({
        userId,
        firstName: 'Uğur',
        lastName: 'Yılmaz',
        email: 'ugur@example.com',
        phoneNumber: '+905551112233',
        phoneVerified: true,
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      }),
      delete: jest.fn(),
    };
    const repository = new HttpUserRepository(httpClient, endpoints);

    await expect(
      repository.updateProfile(userId, {
        firstName: 'Uğur',
        lastName: 'Yılmaz',
        email: 'ugur@example.com',
        phoneNumber: '+905551112233',
      }),
    ).resolves.toMatchObject({ id: userId, firstName: 'Uğur', phoneVerified: true });
    expect(httpClient.patch).toHaveBeenCalledWith(
      '/users/me',
      {
        firstName: 'Uğur',
        lastName: 'Yılmaz',
        email: 'ugur@example.com',
        phoneNumber: '+905551112233',
      },
      { signal: undefined },
    );
  });

  it('ayarları PUT upsert payloadı ve camelCase response ile eşler', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn().mockResolvedValue({
        settingId,
        userId,
        languageId,
        timezone: 'Europe/Istanbul',
        province: 'İstanbul',
        notificationsEnabled: true,
        defaultPushBefore: 15,
        defaultCallBefore: 10,
        emergencyOverride: false,
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      }),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpUserRepository(httpClient, endpoints);

    await expect(
      repository.updatePreferences(userId, {
        languageId,
        timezone: 'Europe/Istanbul',
        province: 'İstanbul',
        notificationsEnabled: true,
        defaultPushBeforeMinutes: 15,
        defaultCallBeforeMinutes: 10,
      }),
    ).resolves.toMatchObject({ languageId, defaultPushBeforeMinutes: 15 });
    expect(httpClient.put).toHaveBeenCalledWith(
      '/user-settings/me',
      {
        languageId,
        timezone: 'Europe/Istanbul',
        province: 'İstanbul',
        notificationsEnabled: true,
        defaultPushBefore: 15,
        defaultCallBefore: 10,
      },
      { signal: undefined },
    );
  });

  it('hesap silme için backend DELETE sözleşmesini kullanır', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const repository = new HttpUserRepository(httpClient, endpoints);

    await repository.deleteAccount(userId);
    expect(httpClient.delete).toHaveBeenCalledWith('/users/me', { signal: undefined });
  });

  it('ayar kaydı olmayan kullanıcıyı onboarding için ayırt edilebilir hata ile bildirir', async () => {
    const httpClient: HttpClient = {
      get: jest
        .fn()
        .mockRejectedValue(new HttpError('Kullanıcı ayarları henüz oluşturulmamış.', 404)),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const repository = new HttpUserRepository(httpClient, endpoints);

    await expect(repository.getPreferences(userId)).rejects.toMatchObject({
      code: 'SETTINGS_NOT_FOUND',
    });
  });
});
