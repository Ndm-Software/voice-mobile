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
import {
  DeleteReminderHistoryUseCase,
  GetReminderHistoryDetailsUseCase,
  GetReminderHistoryUseCase,
  type DeleteReminderHistory,
  type GetReminderHistory,
  type GetReminderHistoryDetails,
} from '@/application/history';
import { GetLanguagesUseCase, type GetLanguages } from '@/application/language';
import {
  ChangeReminderStatusUseCase,
  CreateReminderUseCase,
  DeleteReminderUseCase,
  GetRemindersUseCase,
  GetReminderDetailsUseCase,
  ManagePushNotificationSettingsUseCase,
  UpdateReminderUseCase,
  type ChangeReminderStatus,
  type CreateReminder,
  type DeleteReminder,
  type GetReminders,
  type GetReminderDetails,
  type ManagePushNotificationSettings,
  type UpdateReminder,
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
import {
  DeviceSessionManager,
  InstallationManager,
  PushNotificationManager,
  SessionManager,
} from '@/application/session';
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
import { HttpReminderHistoryRepository } from '@/infrastructure/repositories/http-reminder-history-repository';
import { MockReminderRepository } from '@/infrastructure/repositories/mock-reminder-repository';
import { MockReminderHistoryRepository } from '@/infrastructure/repositories/mock-reminder-history-repository';
import { MockHomeOverviewRepository } from '@/infrastructure/repositories/mock-home-overview-repository';
import { AsyncStorageAdapter } from '@/infrastructure/storage/async-storage-adapter';
import { SecureStoreAdapter } from '@/infrastructure/storage/secure-store-adapter';
import {
  FirebasePushNotificationGateway,
  NoopPushNotificationGateway,
} from '@/infrastructure/notifications';
import type { Session } from '@/domain/models/session';
import type { PushNotificationGateway } from '@/domain/repositories/push-notification-gateway';

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
  readonly pushNotificationManager: PushNotificationManager;
  readonly refreshSession: (session: Session) => Promise<Session>;
  readonly logoutSession: (session: Session) => Promise<void>;
  readonly hydrateSession: (session: Session) => Promise<Session>;
  readonly getProfile: GetProfile;
  readonly getLanguages: GetLanguages;
  readonly getReminders: GetReminders;
  readonly getReminderDetails: GetReminderDetails;
  readonly createReminder: CreateReminder;
  readonly updateReminder: UpdateReminder;
  readonly deleteReminder: DeleteReminder;
  readonly changeReminderStatus: ChangeReminderStatus;
  readonly getReminderHistory: GetReminderHistory;
  readonly getReminderHistoryDetails: GetReminderHistoryDetails;
  readonly deleteReminderHistory: DeleteReminderHistory;
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
  readonly pushNotificationGateway?: PushNotificationGateway;
}

export function createAppContainer(
  config: AppConfig,
  dependencies: ContainerDependencies = {},
): AppContainer {
  const secureStorage = dependencies.secureStorage ?? new SecureStoreAdapter();
  const sessionManager = new SessionManager({ storage: secureStorage });
  const installationManager = new InstallationManager(secureStorage);
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const deviceName = Device.modelName ?? 'Voia Mobile';

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
      deviceName,
    );
    const pushNotificationManager = new PushNotificationManager(
      dependencies.pushNotificationGateway ?? new NoopPushNotificationGateway(),
      deviceSessionManager,
    );
    const userRepository = new MockUserRepository(database, authAccountStore, network);
    const languageRepository = new MockLanguageRepository();
    const reminderRepository = new MockReminderRepository(database, network);
    const reminderHistoryRepository = new MockReminderHistoryRepository(database);

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
      pushNotificationManager,
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
      getReminderDetails: new GetReminderDetailsUseCase(reminderRepository),
      createReminder: new CreateReminderUseCase(reminderRepository),
      updateReminder: new UpdateReminderUseCase(reminderRepository),
      deleteReminder: new DeleteReminderUseCase(reminderRepository),
      changeReminderStatus: new ChangeReminderStatusUseCase(reminderRepository),
      getReminderHistory: new GetReminderHistoryUseCase(reminderHistoryRepository),
      getReminderHistoryDetails: new GetReminderHistoryDetailsUseCase(reminderHistoryRepository),
      deleteReminderHistory: new DeleteReminderHistoryUseCase(reminderHistoryRepository),
      updateProfile: new UpdateProfileUseCase(userRepository),
      getPreferences: new GetPreferencesUseCase(userRepository),
      updatePreferences: new UpdatePreferencesUseCase(userRepository),
      deleteAccount: new DeleteAccountUseCase(userRepository),
    };
  }

  if (!config.apiBaseUrl) {
    throw new Error('API veri kaynağı için EXPO_PUBLIC_API_BASE_URL tanımlanmalıdır.');
  }

  let authRepository: HttpAuthRepository | undefined;
  const httpClient =
    dependencies.httpClient ??
    new FetchHttpClient(config.apiBaseUrl, {
      getAccessToken: async () => (await sessionManager.restore())?.accessToken ?? null,
      refreshAccessToken: async () => {
        const current = await sessionManager.restore();
        if (!current || !authRepository) {
          return false;
        }
        try {
          const renewed = await authRepository.refreshSession(current);
          await sessionManager.save(renewed);
          return true;
        } catch {
          await sessionManager.clear();
          return false;
        }
      },
    });
  const repository = new HttpHomeOverviewRepository(httpClient, config.apiEndpoints.homeOverview);
  authRepository = new HttpAuthRepository(httpClient, config.apiEndpoints, async () => ({
    installationId: await installationManager.getOrCreate(),
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    deviceName: Device.modelName ?? 'Voia Mobile',
  }));
  const phoneVerificationRepository = new HttpPhoneVerificationRepository(httpClient, {
    request: config.apiEndpoints.registrationOtpResend,
    verify: config.apiEndpoints.registrationOtpVerify,
  });
  const deviceSessionManager = new DeviceSessionManager(
    installationManager,
    new HttpDeviceSessionRepository(httpClient, config.apiEndpoints),
    platform,
    deviceName,
  );
  const pushNotificationManager = new PushNotificationManager(
    dependencies.pushNotificationGateway ?? new FirebasePushNotificationGateway(),
    deviceSessionManager,
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
  const reminderHistoryRepository = new HttpReminderHistoryRepository(
    httpClient,
    config.apiEndpoints.reminderHistory,
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
    pushNotificationManager,
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
    getReminderDetails: new GetReminderDetailsUseCase(reminderRepository),
    createReminder: new CreateReminderUseCase(reminderRepository),
    updateReminder: new UpdateReminderUseCase(reminderRepository),
    deleteReminder: new DeleteReminderUseCase(reminderRepository),
    changeReminderStatus: new ChangeReminderStatusUseCase(reminderRepository),
    getReminderHistory: new GetReminderHistoryUseCase(reminderHistoryRepository),
    getReminderHistoryDetails: new GetReminderHistoryDetailsUseCase(reminderHistoryRepository),
    deleteReminderHistory: new DeleteReminderHistoryUseCase(reminderHistoryRepository),
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
