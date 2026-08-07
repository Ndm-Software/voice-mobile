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
  DeleteAccountUseCase,
  GetPreferencesUseCase,
  GetProfileUseCase,
  UpdatePreferencesUseCase,
  UpdateProfileUseCase,
} from '@/application/user';
import { Platform } from 'react-native';
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
import { MockHomeOverviewRepository } from '@/infrastructure/repositories/mock-home-overview-repository';
import { AsyncStorageAdapter } from '@/infrastructure/storage/async-storage-adapter';
import { SecureStoreAdapter } from '@/infrastructure/storage/secure-store-adapter';

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
  readonly getProfile: GetProfile;
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
      getProfile: new GetProfileUseCase(userRepository),
      updateProfile: new UpdateProfileUseCase(userRepository),
      getPreferences: new GetPreferencesUseCase(userRepository),
      updatePreferences: new UpdatePreferencesUseCase(userRepository),
      deleteAccount: new DeleteAccountUseCase(userRepository),
    };
  }

  if (!config.apiBaseUrl) {
    throw new Error('API veri kaynağı için EXPO_PUBLIC_API_BASE_URL tanımlanmalıdır.');
  }

  const httpClient = dependencies.httpClient ?? new FetchHttpClient(config.apiBaseUrl);
  const repository = new HttpHomeOverviewRepository(httpClient, config.apiEndpoints.homeOverview);
  const authRepository = new HttpAuthRepository(httpClient, config.apiEndpoints);
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
    getProfile: new GetProfileUseCase(userRepository),
    updateProfile: new UpdateProfileUseCase(userRepository),
    getPreferences: new GetPreferencesUseCase(userRepository),
    updatePreferences: new UpdatePreferencesUseCase(userRepository),
    deleteAccount: new DeleteAccountUseCase(userRepository),
  };
}

export const appContainer = createAppContainer(appConfig);
