import type { Session } from '@/domain/models/session';

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface RegisterInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly password: string;
}

export interface PendingRegistration {
  readonly email: string;
  readonly phoneNumber: string;
  readonly expiresAt: string;
  readonly resendAvailableAt: string;
}

export type RegisterResult =
  | { readonly kind: 'authenticated'; readonly session: Session }
  | { readonly kind: 'verification-required'; readonly pending: PendingRegistration };

export interface GoogleCredential {
  readonly provider: 'google';
  readonly idToken: string;
}

export interface PasswordResetInput {
  readonly password: string;
  readonly token: string;
}

export interface PasswordResetRequestResult {
  readonly previewToken?: string;
}

export type AuthField =
  'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'password' | 'passwordConfirmation' | 'form';
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export class AuthRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fieldErrors: AuthFieldErrors = {},
  ) {
    super(message);
    this.name = 'AuthRequestError';
  }
}

export interface AuthRepository {
  login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Session>;
  register(input: RegisterInput, signal?: AbortSignal): Promise<RegisterResult>;
  refreshSession?(session: Session, signal?: AbortSignal): Promise<Session>;
  logoutSession?(session: Session, signal?: AbortSignal): Promise<void>;
  hydrateSession?(session: Session, signal?: AbortSignal): Promise<Session>;
  exchangeGoogleCredential(credential: GoogleCredential, signal?: AbortSignal): Promise<Session>;
  requestPasswordReset(email: string, signal?: AbortSignal): Promise<PasswordResetRequestResult>;
  resetPassword(input: PasswordResetInput, signal?: AbortSignal): Promise<void>;
}
