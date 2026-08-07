import type { Session } from '@/domain/models/session';
import {
  AuthRequestError,
  type AuthRepository,
  type GoogleCredential,
  type LoginCredentials,
  type PasswordResetInput,
  type RegisterInput,
} from '@/domain/repositories/auth-repository';
import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

interface AuthEndpoints {
  readonly login: string;
  readonly register: string;
  readonly google: string;
  readonly passwordForgot: string;
  readonly passwordReset: string;
}

interface SessionDto {
  readonly userId?: string | number;
  readonly user_id?: string | number;
  readonly phoneNumber?: string;
  readonly phone_number?: string;
  readonly phoneVerified?: boolean;
  readonly phone_verified?: boolean;
  readonly accessToken?: string;
  readonly access_token?: string;
  readonly refreshToken?: string;
  readonly refresh_token?: string;
  readonly accessTokenExpiresAt?: string;
  readonly access_token_expires_at?: string;
  readonly refreshTokenExpiresAt?: string;
  readonly refresh_token_expires_at?: string;
  readonly message?: string;
}

export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: AuthEndpoints,
  ) {}

  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Session> {
    try {
      const dto = await this.httpClient.post<SessionDto, LoginCredentials>(
        this.endpoints.login,
        credentials,
        { signal },
      );

      return mapSession(dto, { defaultPhoneVerified: true });
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async register(input: RegisterInput, signal?: AbortSignal): Promise<Session> {
    try {
      const dto = await this.httpClient.post<SessionDto>(
        this.endpoints.register,
        {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phoneNumber: input.phoneNumber,
          password: input.password,
        },
        { signal },
      );
      return mapSession(dto, {
        defaultPhoneNumber: input.phoneNumber,
        defaultPhoneVerified: false,
      });
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async exchangeGoogleCredential(
    credential: GoogleCredential,
    signal?: AbortSignal,
  ): Promise<Session> {
    try {
      const dto = await this.httpClient.post<SessionDto>(
        this.endpoints.google,
        { provider: credential.provider, id_token: credential.idToken },
        { signal },
      );
      return mapSession(dto, { defaultPhoneVerified: true });
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async requestPasswordReset(email: string, signal?: AbortSignal) {
    try {
      await this.httpClient.post<unknown>(this.endpoints.passwordForgot, { email }, { signal });
      return {};
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async resetPassword(input: PasswordResetInput, signal?: AbortSignal): Promise<void> {
    try {
      await this.httpClient.post<unknown>(this.endpoints.passwordReset, input, { signal });
    } catch (error) {
      throw mapAuthError(error);
    }
  }
}

interface SessionDefaults {
  readonly defaultPhoneNumber?: string;
  readonly defaultPhoneVerified: boolean;
}

function mapSession(dto: SessionDto, defaults: SessionDefaults): Session {
  const userId = dto.userId ?? dto.user_id;
  const accessToken = dto.accessToken ?? dto.access_token;
  const refreshToken = dto.refreshToken ?? dto.refresh_token;
  const accessTokenExpiresAt = dto.accessTokenExpiresAt ?? dto.access_token_expires_at;
  const refreshTokenExpiresAt = dto.refreshTokenExpiresAt ?? dto.refresh_token_expires_at;
  if (
    userId === undefined ||
    accessToken === undefined ||
    refreshToken === undefined ||
    accessTokenExpiresAt === undefined ||
    refreshTokenExpiresAt === undefined
  ) {
    throw new AuthRequestError(
      'AUTH_MOBILE_SESSION_UNSUPPORTED',
      'Mobil oturum sözleşmesi henüz hazır değil.',
      { form: 'Mobil oturum için backend token sözleşmesi gerekiyor.' },
    );
  }
  const phoneNumber = dto.phoneNumber ?? dto.phone_number ?? defaults.defaultPhoneNumber;
  return {
    userId: String(userId),
    ...(phoneNumber ? { phoneNumber } : {}),
    phoneVerified: dto.phoneVerified ?? dto.phone_verified ?? defaults.defaultPhoneVerified,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

function mapAuthError(error: unknown): Error {
  if (error instanceof HttpError && (error.status === 401 || error.status === 422)) {
    return new AuthRequestError(
      'AUTH_REQUEST_REJECTED',
      'Bilgilerinizi kontrol edip tekrar deneyin.',
      {
        form: 'Bilgilerinizi kontrol edip tekrar deneyin.',
      },
    );
  }

  return error instanceof Error ? error : new Error('Kimlik doğrulama isteği tamamlanamadı.');
}
