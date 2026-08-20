import type { DataSource } from '@/core/types/data-source';
import type { MockNetworkOptions, MockScenario } from '@/core/types/mock-network';

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  readonly environment: AppEnvironment;
  readonly dataSource: DataSource;
  readonly apiBaseUrl: string;
  readonly apiEndpoints: {
    readonly homeOverview: string;
    readonly login: string;
    readonly authMe: string;
    readonly register: string;
    readonly google: string;
    readonly passwordForgot: string;
    readonly passwordReset: string;
    readonly registrationOtpResend: string;
    readonly registrationOtpVerify: string;
    readonly logout: string;
    readonly currentDevice: string;
    readonly refresh?: string;
    readonly languages: string;
    readonly reminders: string;
    readonly reminderHistory: string;
    readonly pushNotificationSettings: string;
    readonly profile: string;
    readonly preferences: string;
  };
  readonly mockNetwork: MockNetworkOptions;
}

const environments: readonly AppEnvironment[] = ['development', 'staging', 'production'];

export function resolveEnvironment(value: string | undefined): AppEnvironment {
  return environments.includes(value as AppEnvironment) ? (value as AppEnvironment) : 'development';
}

export function resolveDataSource(value: string | undefined): DataSource {
  return value === 'api' ? 'api' : 'mock';
}

export function resolveMockScenario(value: string | undefined): MockScenario {
  if (value === 'intermittent-error' || value === 'always-error') {
    return value;
  }

  return 'success';
}

export function resolveMockDelay(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

const minimumMockDelayMs = resolveMockDelay(process.env.EXPO_PUBLIC_MOCK_DELAY_MIN_MS, 300);
const configuredMaximumMockDelayMs = resolveMockDelay(
  process.env.EXPO_PUBLIC_MOCK_DELAY_MAX_MS,
  800,
);

export const appConfig: AppConfig = Object.freeze({
  environment: resolveEnvironment(process.env.EXPO_PUBLIC_APP_ENV),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '',
  dataSource: resolveDataSource(process.env.EXPO_PUBLIC_DATA_SOURCE),
  apiEndpoints: Object.freeze({
    homeOverview: '/mobile/home-overview',
    login: '/auth/login',
    authMe: '/auth/me',
    register: '/auth/register',
    google: '/auth/google',
    passwordForgot: '/auth/password/forgot',
    passwordReset: '/auth/password/reset',
    registrationOtpResend: '/auth/register/resend',
    registrationOtpVerify: '/auth/register/verify',
    logout: '/auth/logout',
    currentDevice: '/devices',
    refresh: '/auth/refresh',
    languages: '/languages',
    reminders: '/reminders',
    reminderHistory: '/reminder-history',
    pushNotificationSettings: '/push-notification-settings',
    profile: '/users/me',
    preferences: '/user-settings/me',
  }),
  mockNetwork: Object.freeze({
    minimumDelayMs: minimumMockDelayMs,
    maximumDelayMs: Math.max(minimumMockDelayMs, configuredMaximumMockDelayMs),
    scenario: resolveMockScenario(process.env.EXPO_PUBLIC_MOCK_SCENARIO),
  }),
});
