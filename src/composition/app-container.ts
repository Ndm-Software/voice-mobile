import {
  GetHomeOverviewUseCase,
  type GetHomeOverview,
} from '@/application/use-cases/get-home-overview';
import {
  LoginUseCase,
  RegisterUseCase,
  ExchangeGoogleCredentialUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  RequestPhoneVerificationUseCase,
  VerifyPhoneUseCase,
  type ExchangeGoogleCredential,
  type Login,
  type Register,
  type RequestPasswordReset,
  type ResetPassword,
  type RequestPhoneVerification,
  type VerifyPhone,
} from '@/application/auth';
import type {
  DeleteAccount,
  GetPreferences,
  GetProfile,
  UpdatePreferences,
  UpdateProfile,
} from '@/application/user';
import { GetLanguagesUseCase, type GetLanguages } from '@/application/language';
import {
  CreateReminderUseCase,
  GetRemindersUseCase,
  ManagePushNotificationSettingsUseCase,
  type CreateReminder,
  type GetReminders,
  type ManagePushNotificationSettings,
} from '@/application/reminder';
import {
  DeleteAccountUseCase,
  GetPreferencesUseCase,
  GetProfileUseCase,
  UpdatePreferencesUseCase,
  UpdateProfileUseCase,
} from '@/application/user';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { appConfig, type AppConfig } from '@/config/environment';
import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import type { SecureStorage } from '@/core/storage/secure-storage';
import { DeviceSessionManager, InstallationManager, SessionManager } from '@/application/session';
import { FetchHttpClient } from '@/infrastructure/http/fetch-http-client';
import type { HttpClient } from '@/infrastructure/http/http-client';
import { MockNetwork } from '@/infrastructure/mock/mock-network';
import { MockAuthAccountStore } from '@/infrastructure/mock/auth/mock-auth-account-store';
import { PersistentMockDatabase } from '@/infrastructure/mock/database/persistent-mock-database';
import { HttpHomeOverviewRepository } from '@/infrastructure/repositories/http-home-overview-repository';
import { HttpAuthRepository } from '@/infrastructure/repositories/http-auth-repository';
import { MockAuthRepository } from '@/infrastructure/repositories/mock-auth-repository';
import { MockPhoneVerificationRepository } from '@/infrastructure/repositories/mock-phone-verification-repository';
import { HttpPhoneVerificationRepository } from '@/infrastructure/repositories/http-phone-verification-repository';
import { MockDeviceSessionRepository } from '@/infrastructure/repositories/mock-device-session-repository';
import { HttpDeviceSessionRepository } from '@/infrastructure/repositories/http-device-session-repository';
import { MockUserRepository } from '@/infrastructure/repositories/mock-user-repository';
import { HttpUserRepository } from '@/infrastructure/repositories/http-user-repository';
import { HttpLanguageRepository } from '@/infrastructure/repositories/http-language-repository';
import { MockLanguageRepository } from '@/infrastructure/repositories/mock-language-repository';
import { HttpReminderRepository } from '@/infrastructure/repositories/http-reminder-repository';
import { HttpPushNotificationSettingsRepository } from '@/infrastructure/repositories/http-push-notification-settings-repository';
import { MockReminderRepository } from '@/infrastructure/repositories/mock-reminder-repository';
import { MockHomeOverviewRepository } from '@/infrastructure/repositories/mock-home-overview-repository';
import { AsyncStorageAdapter } from '@/infrastructure/storage/async-storage-adapter';
import { SecureStoreAdapter } from '@/infrastructure/storage/secure-store-adapter';
import type { Session } from '@/domain/models/session';

export interface AppContainer {
  readonly getHomeOverview: GetHomeOverview;
  readonly login: Login;
  readonly register: Register;
  readonly exchangeGoogleCredential: ExchangeGoogleCredential;
  readonly requestPasswordReset: RequestPasswordReset;
  readonly resetPassword: ResetPassword;
  readonly requestPhoneVerification: RequestPhoneVerification;
  readonly verifyPhone: VerifyPhone;
  readonly sessionManager: SessionManager;
  readonly deviceSessionManager: DeviceSessionManager;
  readonly refreshSession: (session: Session) => Promise<Session>;
  readonly logoutSession: (session: Session) => Promise<void>;
  readonly hydrateSession: (session: Session) => Promise<Session>;
  readonly getProfile: GetProfile;
  readonly getLanguages: GetLanguages;
  readonly getReminders: GetReminders;
  readonly createReminder: CreateReminder;
  readonly managePushNotificationSettings?: ManagePushNotificationSettings;
  readonly updateProfile: UpdateProfile;
  readonly getPreferences: GetPreferences;
  readonly updatePreferences: UpdatePreferences;
  readonly deleteAccount: DeleteAccount;
}

interface ContainerDependencies {
  readonly httpClient?: HttpClient;
  readonly keyValueStorage?: KeyValueStorage;
  readonly secureStorage?: SecureStorage;
  readonly random?: () => number;
}

export function createAppContainer(
  config: AppConfig,
  dependencies: ContainerDependencies = {},
): AppContainer {
  const secureStorage = dependencies.secureStorage ?? new SecureStoreAdapter();
  const sessionManager = new SessionManager({ storage: secureStorage });
  const installationManager = new InstallationManager(secureStorage);
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  if (config.dataSource === 'mock') {
    const storage = dependencies.keyValueStorage ?? new AsyncStorageAdapter();
    const database = new PersistentMockDatabase(storage);
    const network = new MockNetwork(config.mockNetwork, dependencies.random);
    const authAccountStore = new MockAuthAccountStore(secureStorage);
    const authRepository = new MockAuthRepository(network, undefined, authAccountStore);
    const phoneVerificationRepository = new MockPhoneVerificationRepository(
      network,
      storage,
      authAccountStore,
    );
    const deviceSessionManager = new DeviceSessionManager(
      installationManager,
      new MockDeviceSessionRepository(database),
      platform,
    );
    const userRepository = new MockUserRepository(database, authAccountStore, network);
    const languageRepository = new MockLanguageRepository();
    const reminderRepository = new MockReminderRepository(database, network);

    return {
      getHomeOverview: new GetHomeOverviewUseCase(
        new MockHomeOverviewRepository(database, network),
      ),
      login: new LoginUseCase(authRepository),
      register: new RegisterUseCase(authRepository),
      exchangeGoogleCredential: new ExchangeGoogleCredentialUseCase(authRepository),
      requestPasswordReset: new RequestPasswordResetUseCase(authRepository),
      resetPassword: new ResetPasswordUseCase(authRepository),
      requestPhoneVerification: new RequestPhoneVerificationUseCase(phoneVerificationRepository),
      verifyPhone: new VerifyPhoneUseCase(phoneVerificationRepository),
      sessionManager,
      deviceSessionManager,
      refreshSession: async (session) =>
        (await authRepository.refreshSession?.(session)) ?? session,
      logoutSession: async (session) => {
        await authRepository.logoutSession?.(session);
      },
      hydrateSession: async (session) =>
        (await authRepository.hydrateSession?.(session)) ?? session,
      getProfile: new GetProfileUseCase(userRepository),
      getLanguages: new GetLanguagesUseCase(languageRepository),
      getReminders: new GetRemindersUseCase(reminderRepository),
      createReminder: new CreateReminderUseCase(reminderRepository),
      updateProfile: new UpdateProfileUseCase(userRepository),
      getPreferences: new GetPreferencesUseCase(userRepository),
      updatePreferences: new UpdatePreferencesUseCase(userRepository),
      deleteAccount: new DeleteAccountUseCase(userRepository),
    };
  }

  if (!config.apiBaseUrl) {
    throw new Error('API veri kaynağı için EXPO_PUBLIC_API_BASE_URL tanımlanmalıdır.');
  }

  const httpClient =
    dependencies.httpClient ??
    new FetchHttpClient(config.apiBaseUrl, {
      getAccessToken: async () => (await sessionManager.restore())?.accessToken ?? null,
    });
  const repository = new HttpHomeOverviewRepository(httpClient, config.apiEndpoints.homeOverview);
  const authRepository = new HttpAuthRepository(httpClient, config.apiEndpoints, async () => ({
    installationId: await installationManager.getOrCreate(),
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    deviceName: Device.modelName ?? 'Voia Mobile',
  }));
  const phoneVerificationRepository = new HttpPhoneVerificationRepository(httpClient, {
    request: config.apiEndpoints.phoneOtpRequest,
    verify: config.apiEndpoints.phoneOtpVerify,
  });
  const deviceSessionManager = new DeviceSessionManager(
    installationManager,
    new HttpDeviceSessionRepository(httpClient, config.apiEndpoints),
    platform,
  );
  const userRepository = new HttpUserRepository(httpClient, {
    profile: config.apiEndpoints.profile,
    preferences: config.apiEndpoints.preferences,
  });
  const languageRepository = new HttpLanguageRepository(httpClient, config.apiEndpoints.languages);
  const reminderRepository = new HttpReminderRepository(httpClient, {
    list: config.apiEndpoints.reminders,
  });
  const pushNotificationSettingsRepository = new HttpPushNotificationSettingsRepository(
    httpClient,
    config.apiEndpoints.pushNotificationSettings,
  );

  return {
    getHomeOverview: new GetHomeOverviewUseCase(repository),
    login: new LoginUseCase(authRepository),
    register: new RegisterUseCase(authRepository),
    exchangeGoogleCredential: new ExchangeGoogleCredentialUseCase(authRepository),
    requestPasswordReset: new RequestPasswordResetUseCase(authRepository),
    resetPassword: new ResetPasswordUseCase(authRepository),
    requestPhoneVerification: new RequestPhoneVerificationUseCase(phoneVerificationRepository),
    verifyPhone: new VerifyPhoneUseCase(phoneVerificationRepository),
    sessionManager,
    deviceSessionManager,
    refreshSession: async (session) => {
      if (!authRepository.refreshSession) {
        return session;
      }
      return await authRepository.refreshSession(session);
    },
    logoutSession: async (session) => {
      await authRepository.logoutSession?.(session);
    },
    hydrateSession: async (session) => (await authRepository.hydrateSession?.(session)) ?? session,
    getProfile: new GetProfileUseCase(userRepository),
    getLanguages: new GetLanguagesUseCase(languageRepository),
    getReminders: new GetRemindersUseCase(reminderRepository),
    createReminder: new CreateReminderUseCase(reminderRepository),
    managePushNotificationSettings: new ManagePushNotificationSettingsUseCase(
      pushNotificationSettingsRepository,
    ),
    updateProfile: new UpdateProfileUseCase(userRepository),
    getPreferences: new GetPreferencesUseCase(userRepository),
    updatePreferences: new UpdatePreferencesUseCase(userRepository),
    deleteAccount: new DeleteAccountUseCase(userRepository),
  };
}

export const appContainer = createAppContainer(appConfig);
