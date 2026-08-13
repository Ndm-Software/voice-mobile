import type { AppConfig } from '@/config/environment';
import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import type { HttpClient } from '@/infrastructure/http/http-client';

import { createAppContainer } from './app-container';

const baseConfig: AppConfig = {
  environment: 'development',
  dataSource: 'mock',
  apiBaseUrl: '',
  apiEndpoints: {
    homeOverview: '/mobile/home-overview',
    login: '/auth/login',
    authMe: '/auth/me',
    register: '/auth/register',
    google: '/auth/google',
    passwordForgot: '/auth/password/forgot',
    passwordReset: '/auth/password/reset',
    phoneOtpRequest: '/auth/phone/otp/request',
    phoneOtpVerify: '/auth/phone/otp/verify',
    logout: '/auth/logout',
    currentDevice: '/me/devices/current',
    languages: '/languages',
    reminders: '/reminders',
    pushNotificationSettings: '/push-notification-settings',
    profile: '/users/me',
    preferences: '/user-settings/me',
  },
  mockNetwork: { minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' },
};

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

describe('createAppContainer', () => {
  it('varsayılan olarak mock repository bağlar', async () => {
    const container = createAppContainer(baseConfig, { keyValueStorage: new MemoryStorage() });

    await expect(container.getHomeOverview.execute()).resolves.toMatchObject({
      applicationName: 'Voia',
      dataSource: 'mock',
      readiness: 'ready',
      mockDataSummary: {
        userDisplayName: 'Uğur Yılmaz',
        activeReminderCount: 2,
        deviceCount: 1,
        historyCount: 2,
      },
    });
  });

  it('api seçildiğinde HTTP repository ve DTO mapper kullanır', async () => {
    const httpClient: HttpClient = {
      get: jest.fn().mockResolvedValue({
        application_name: 'Voia API',
        assistant_tagline: 'API bağlantısı hazır.',
        readiness: 'ready',
      }),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    const container = createAppContainer(
      { ...baseConfig, dataSource: 'api', apiBaseUrl: 'https://api.voia.test' },
      { httpClient },
    );

    await expect(container.getHomeOverview.execute()).resolves.toEqual({
      applicationName: 'Voia API',
      assistantTagline: 'API bağlantısı hazır.',
      readiness: 'ready',
      dataSource: 'api',
    });
    expect(httpClient.get).toHaveBeenCalledWith('/mobile/home-overview', {
      signal: undefined,
    });
  });

  it('api seçilip base URL verilmezse hızlıca hata üretir', () => {
    expect(() => createAppContainer({ ...baseConfig, dataSource: 'api' })).toThrow(
      'EXPO_PUBLIC_API_BASE_URL',
    );
  });
});
