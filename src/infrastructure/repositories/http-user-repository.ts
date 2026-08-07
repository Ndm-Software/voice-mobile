import type { User, UserSettings } from '@/domain/models/account';
import { UserRequestError } from '@/domain/repositories/user-repository';
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
  readonly userId?: string | number;
  readonly id?: string | number;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly phone_number?: string;
  readonly phoneVerified?: boolean;
  readonly phone_verified?: boolean;
  readonly createdAt?: string;
  readonly created_at?: string;
  readonly updatedAt?: string;
  readonly updated_at?: string;
}

interface SettingsDto {
  readonly settingId?: string | number;
  readonly id?: string | number;
  readonly userId?: string | number;
  readonly user_id?: string | number;
  readonly languageId?: string | number;
  readonly language_id?: string | number;
  readonly timezone: string;
  readonly province?: string | null;
  readonly notificationsEnabled?: boolean;
  readonly notifications_enabled?: boolean;
  readonly defaultPushBefore?: number;
  readonly default_push_before_minutes?: number;
  readonly defaultCallBefore?: number;
  readonly default_call_before_minutes?: number;
  readonly silent_start?: string;
  readonly silent_end?: string;
  readonly createdAt?: string;
  readonly created_at?: string;
  readonly updatedAt?: string;
  readonly updated_at?: string;
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
        await this.httpClient.patch<UserDto>(
          this.endpoints.profile,
          {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phoneNumber: input.phoneNumber,
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
        await this.httpClient.put<SettingsDto>(
          this.endpoints.preferences,
          {
            languageId: Number(input.languageId),
            timezone: input.timezone,
            province: input.province,
            notificationsEnabled: input.notificationsEnabled,
            defaultPushBefore: input.defaultPushBeforeMinutes,
            defaultCallBefore: input.defaultCallBeforeMinutes,
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
      await this.httpClient.delete<unknown>(this.endpoints.profile, { signal });
    } catch (error) {
      throw mapUserError(error);
    }
  }
}

function mapUser(dto: UserDto): User {
  const id = dto.userId ?? dto.id;
  const firstName = dto.firstName ?? dto.first_name;
  const lastName = dto.lastName ?? dto.last_name;
  const phoneNumber = dto.phoneNumber ?? dto.phone_number;
  const phoneVerified = dto.phoneVerified ?? dto.phone_verified;
  const createdAt = dto.createdAt ?? dto.created_at;
  const updatedAt = dto.updatedAt ?? dto.updated_at;

  if (
    id === undefined ||
    firstName === undefined ||
    lastName === undefined ||
    phoneNumber === undefined ||
    phoneVerified === undefined ||
    createdAt === undefined ||
    updatedAt === undefined
  ) {
    throw new Error('Profil response alanları eksik.');
  }

  return {
    id: String(id),
    firstName,
    lastName,
    email: dto.email,
    phoneNumber,
    phoneVerified,
    createdAt,
    updatedAt,
  };
}

function mapSettings(dto: SettingsDto): UserSettings {
  const id = dto.settingId ?? dto.id;
  const userId = dto.userId ?? dto.user_id;
  const languageId = dto.languageId ?? dto.language_id;
  const notificationsEnabled = dto.notificationsEnabled ?? dto.notifications_enabled;
  const defaultPushBefore = dto.defaultPushBefore ?? dto.default_push_before_minutes;
  const defaultCallBefore = dto.defaultCallBefore ?? dto.default_call_before_minutes;
  const createdAt = dto.createdAt ?? dto.created_at;
  const updatedAt = dto.updatedAt ?? dto.updated_at;

  if (
    id === undefined ||
    userId === undefined ||
    languageId === undefined ||
    notificationsEnabled === undefined ||
    defaultPushBefore === undefined ||
    defaultCallBefore === undefined ||
    createdAt === undefined ||
    updatedAt === undefined
  ) {
    throw new Error('Kullanıcı ayarları response alanları eksik.');
  }

  return {
    id: String(id),
    userId: String(userId),
    languageId: String(languageId),
    timezone: dto.timezone,
    province: dto.province ?? undefined,
    notificationsEnabled,
    defaultPushBeforeMinutes: defaultPushBefore,
    defaultCallBeforeMinutes: defaultCallBefore,
    silentStart: dto.silent_start,
    silentEnd: dto.silent_end,
    createdAt,
    updatedAt,
  };
}

function mapUserError(error: unknown): Error {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return new UserRequestError('USER_NOT_FOUND', 'Kullanıcı bilgileri bulunamadı.');
    }
    if ([400, 409, 422].includes(error.status)) {
      return new UserRequestError('USER_REQUEST_REJECTED', 'Bilgileri kontrol edin.');
    }
  }
  return error instanceof Error ? error : new Error('Kullanıcı bilgileri alınamadı.');
}
