import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpUserRepository } from './http-user-repository';

describe('HttpUserRepository', () => {
  const endpoints = { profile: '/users/me', preferences: '/user-settings/me' };

  it('backend camelCase profil response ve PATCH payloadını eşler', async () => {
    const httpClient: HttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn().mockResolvedValue({
        userId: 1001,
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
      repository.updateProfile('1001', {
        firstName: 'Uğur',
        lastName: 'Yılmaz',
        email: 'ugur@example.com',
        phoneNumber: '+905551112233',
      }),
    ).resolves.toMatchObject({ id: '1001', firstName: 'Uğur', phoneVerified: true });
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
        settingId: 4,
        userId: 1001,
        languageId: 1,
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
      repository.updatePreferences('1001', {
        languageId: '1',
        timezone: 'Europe/Istanbul',
        province: 'İstanbul',
        notificationsEnabled: true,
        defaultPushBeforeMinutes: 15,
        defaultCallBeforeMinutes: 10,
      }),
    ).resolves.toMatchObject({ languageId: '1', defaultPushBeforeMinutes: 15 });
    expect(httpClient.put).toHaveBeenCalledWith(
      '/user-settings/me',
      {
        languageId: 1,
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

    await repository.deleteAccount('1001');
    expect(httpClient.delete).toHaveBeenCalledWith('/users/me', { signal: undefined });
  });
});
