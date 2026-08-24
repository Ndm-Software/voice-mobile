import type { HttpClient } from '@/infrastructure/http/http-client';

import { HttpPushNotificationSettingsRepository } from './http-push-notification-settings-repository';

describe('HttpPushNotificationSettingsRepository', () => {
  const endpoint = '/push-notification-settings';
  const pushId = 'cd3e3f6a-c38c-42fb-bbea-fc52c0f82b50';
  const reminderId = '16ba0196-904d-4c21-b959-e9bf4b1017b5';
  const dto = {
    pushId,
    reminderId,
    minutesBefore: 15,
    enabled: true,
    createdAt: '2026-08-14T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
  };

  function createClient(): HttpClient {
    return {
      get: jest.fn().mockResolvedValue([dto]),
      post: jest.fn().mockResolvedValue(dto),
      put: jest.fn(),
      patch: jest.fn().mockResolvedValue({ ...dto, minutesBefore: 30, enabled: false }),
      delete: jest.fn().mockResolvedValue({ message: 'deleted' }),
    };
  }

  it('UUID push ayarlarını listeler ve oluşturur', async () => {
    const httpClient = createClient();
    const repository = new HttpPushNotificationSettingsRepository(httpClient, endpoint);

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({ id: pushId, reminderId }),
    ]);
    await repository.create({ reminderId, minutesBefore: 15 });

    expect(httpClient.post).toHaveBeenCalledWith(
      endpoint,
      { reminderId, minutesBefore: 15 },
      { signal: undefined },
    );
  });

  it('UUID ayarı günceller ve siler', async () => {
    const httpClient = createClient();
    const repository = new HttpPushNotificationSettingsRepository(httpClient, endpoint);

    await expect(
      repository.update(pushId, { minutesBefore: 30, enabled: false }),
    ).resolves.toMatchObject({ id: pushId, minutesBefore: 30, enabled: false });
    await repository.remove(pushId);

    expect(httpClient.patch).toHaveBeenCalledWith(
      `${endpoint}/${pushId}`,
      { minutesBefore: 30, enabled: false },
      { signal: undefined },
    );
    expect(httpClient.delete).toHaveBeenCalledWith(`${endpoint}/${pushId}`, {
      signal: undefined,
    });
  });
});
