import type { User, UserSettings } from '@/domain/models/account';

export interface UpdateProfileInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string;
}

export interface UpdatePreferencesInput {
  readonly languageId: string;
  readonly timezone: string;
  readonly province: string;
  readonly notificationsEnabled: boolean;
  readonly defaultPushBeforeMinutes: number;
  readonly defaultCallBeforeMinutes: number;
}

export class UserRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fieldErrors: Partial<
      Record<keyof UpdateProfileInput | keyof UpdatePreferencesInput, string>
    > = {},
  ) {
    super(message);
    this.name = 'UserRequestError';
  }
}

export interface UserRepository {
  getProfile(userId: string, signal?: AbortSignal): Promise<User>;
  updateProfile(userId: string, input: UpdateProfileInput, signal?: AbortSignal): Promise<User>;
  getPreferences(userId: string, signal?: AbortSignal): Promise<UserSettings>;
  updatePreferences(
    userId: string,
    input: UpdatePreferencesInput,
    signal?: AbortSignal,
  ): Promise<UserSettings>;
  deleteAccount(userId: string, signal?: AbortSignal): Promise<void>;
}
