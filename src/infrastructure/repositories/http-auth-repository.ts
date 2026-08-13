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
  readonly authMe?: string;
  readonly register: string;
  readonly google: string;
  readonly passwordForgot: string;
  readonly passwordReset: string;
  readonly refresh?: string;
  readonly logout?: string;
}

export interface AuthDeviceContext {
  readonly installationId: string;
  readonly platform: 'ANDROID' | 'IOS';
  readonly deviceName: string;
  readonly pushToken?: string;
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
  readonly user?: {
    readonly userId?: string | number;
    readonly phoneNumber?: string;
    readonly phoneVerified?: boolean;
  };
}

interface CurrentUserDto {
  readonly userId: string | number;
  readonly phoneNumber?: string;
  readonly phoneVerified?: boolean;
}

export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: AuthEndpoints,
    private readonly getDeviceContext?: () => Promise<AuthDeviceContext>,
  ) {}

  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Session> {
    try {
      const deviceContext = this.getDeviceContext ? await this.getDeviceContext() : undefined;
      const dto = await this.httpClient.post<
        SessionDto,
        LoginCredentials & Partial<AuthDeviceContext>
      >(this.endpoints.login, deviceContext ? { ...credentials, ...deviceContext } : credentials, {
        signal,
      });

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
      if (hasSessionTokens(dto)) {
        return mapSession(dto, {
          defaultPhoneNumber: input.phoneNumber,
          defaultPhoneVerified: false,
        });
      }

      // Backend kayıt endpointi yalnız kullanıcı oluşturur; mobil istemciyi
      // aynı bilgilerle giriş yaptırarak tek bir session sözleşmesi sunar.
      return await this.login({ email: input.email, password: input.password }, signal);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async refreshSession(session: Session, signal?: AbortSignal): Promise<Session> {
    try {
      const dto = await this.httpClient.post<SessionDto>(
        this.endpoints.refresh ?? '/auth/refresh',
        { refreshToken: session.refreshToken },
        { signal },
      );
      return mapSession(dto, {
        defaultPhoneNumber: session.phoneNumber,
        defaultPhoneVerified: session.phoneVerified ?? true,
      });
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async logoutSession(session: Session, signal?: AbortSignal): Promise<void> {
    try {
      await this.httpClient.post<unknown>(
        this.endpoints.logout ?? '/auth/logout',
        { refreshToken: session.refreshToken },
        { signal },
      );
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async hydrateSession(session: Session, signal?: AbortSignal): Promise<Session> {
    try {
      const user = await this.httpClient.get<CurrentUserDto>(this.endpoints.authMe ?? '/auth/me', {
        signal,
      });
      return {
        ...session,
        userId: String(user.userId),
        ...(user.phoneNumber ? { phoneNumber: user.phoneNumber } : {}),
        phoneVerified: user.phoneVerified ?? session.phoneVerified,
      };
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
  const accessToken = dto.accessToken ?? dto.access_token;
  const refreshToken = dto.refreshToken ?? dto.refresh_token;
  const accessClaims = accessToken ? decodeJwt(accessToken) : undefined;
  const refreshClaims = refreshToken ? decodeJwt(refreshToken) : undefined;
  const userId = dto.userId ?? dto.user_id ?? dto.user?.userId ?? accessClaims?.sub;
  const accessTokenExpiresAt =
    dto.accessTokenExpiresAt ?? dto.access_token_expires_at ?? claimsExpiry(accessClaims);
  const refreshTokenExpiresAt =
    dto.refreshTokenExpiresAt ?? dto.refresh_token_expires_at ?? claimsExpiry(refreshClaims);
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
  const phoneNumber =
    dto.phoneNumber ?? dto.phone_number ?? dto.user?.phoneNumber ?? defaults.defaultPhoneNumber;
  return {
    userId: String(userId),
    ...(phoneNumber ? { phoneNumber } : {}),
    phoneVerified:
      dto.phoneVerified ??
      dto.phone_verified ??
      dto.user?.phoneVerified ??
      defaults.defaultPhoneVerified,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

function hasSessionTokens(dto: SessionDto): boolean {
  return (
    Boolean(dto.accessToken ?? dto.access_token) && Boolean(dto.refreshToken ?? dto.refresh_token)
  );
}

interface JwtClaims {
  readonly sub?: string | number;
  readonly exp?: number;
}

function decodeJwt(token: string): JwtClaims | undefined {
  try {
    const segment = token.split('.')[1];
    if (!segment || typeof globalThis.atob !== 'function') {
      return undefined;
    }
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(globalThis.atob(padded)) as JwtClaims;
  } catch {
    return undefined;
  }
}

function claimsExpiry(claims: JwtClaims | undefined): string | undefined {
  return claims?.exp ? new Date(claims.exp * 1000).toISOString() : undefined;
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
