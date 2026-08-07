import type { User, UserSettings } from '@/domain/models/account';
import type {
  UpdatePreferencesInput,
  UpdateProfileInput,
  UserRepository,
} from '@/domain/repositories/user-repository';
import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

interface UserEndpoints {
  readonly profile: string;
  readonly preferences: string;
}

interface UserDto {
  readonly id: string | number;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly phone_number: string;
  readonly phone_verified: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

interface SettingsDto {
  readonly id: string | number;
  readonly user_id: string | number;
  readonly language_id: string | number;
  readonly timezone: string;
  readonly province?: string;
  readonly notifications_enabled: boolean;
  readonly default_push_before_minutes: number;
  readonly default_call_before_minutes: number;
  readonly silent_start?: string;
  readonly silent_end?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export class HttpUserRepository implements UserRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: UserEndpoints,
  ) {}

  async getProfile(_userId: string, signal?: AbortSignal): Promise<User> {
    try {
      return mapUser(await this.httpClient.get<UserDto>(this.endpoints.profile, { signal }));
    } catch (error) {
      throw mapUserError(error);
    }
  }

  async updateProfile(
    _userId: string,
    input: UpdateProfileInput,
    signal?: AbortSignal,
  ): Promise<User> {
    try {
      return mapUser(
        await this.httpClient.post<UserDto>(
          this.endpoints.profile,
          {
            first_name: input.firstName,
            last_name: input.lastName,
            email: input.email,
            phone_number: input.phoneNumber,
          },
          { signal },
        ),
      );
    } catch (error) {
      throw mapUserError(error);
    }
  }

  async getPreferences(_userId: string, signal?: AbortSignal): Promise<UserSettings> {
    try {
      return mapSettings(
        await this.httpClient.get<SettingsDto>(this.endpoints.preferences, { signal }),
      );
    } catch (error) {
      throw mapUserError(error);
    }
  }

  async updatePreferences(
    _userId: string,
    input: UpdatePreferencesInput,
    signal?: AbortSignal,
  ): Promise<UserSettings> {
    try {
      return mapSettings(
        await this.httpClient.post<SettingsDto>(
          this.endpoints.preferences,
          {
            language_id: input.languageId,
            timezone: input.timezone,
            province: input.province,
            notifications_enabled: input.notificationsEnabled,
            default_push_before_minutes: input.defaultPushBeforeMinutes,
            default_call_before_minutes: input.defaultCallBeforeMinutes,
          },
          { signal },
        ),
      );
    } catch (error) {
      throw mapUserError(error);
    }
  }

  async deleteAccount(_userId: string, signal?: AbortSignal): Promise<void> {
    try {
      await this.httpClient.post<unknown>(`${this.endpoints.profile}/delete`, {}, { signal });
    } catch (error) {
      throw mapUserError(error);
    }
  }
}

function mapUser(dto: UserDto): User {
  return {
    id: String(dto.id),
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    phoneNumber: dto.phone_number,
    phoneVerified: dto.phone_verified,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapSettings(dto: SettingsDto): UserSettings {
  return {
    id: String(dto.id),
    userId: String(dto.user_id),
    languageId: String(dto.language_id),
    timezone: dto.timezone,
    province: dto.province,
    notificationsEnabled: dto.notifications_enabled,
    defaultPushBeforeMinutes: dto.default_push_before_minutes,
    defaultCallBeforeMinutes: dto.default_call_before_minutes,
    silentStart: dto.silent_start,
    silentEnd: dto.silent_end,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapUserError(error: unknown): Error {
  if (error instanceof HttpError && error.status === 422) {
    return new Error('Bilgileri kontrol edin.');
  }
  return error instanceof Error ? error : new Error('Kullanıcı bilgileri alınamadı.');
}
