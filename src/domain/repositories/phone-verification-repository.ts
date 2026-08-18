export interface PhoneVerificationChallenge {
  readonly id: string;
  readonly maskedPhoneNumber: string;
  readonly expiresAt: string;
  readonly resendAvailableAt: string;
  readonly remainingAttempts?: number;
  readonly maxAttempts?: number;
  readonly developmentCode?: string;
}

export class PhoneVerificationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly remainingAttempts?: number,
  ) {
    super(message);
    this.name = 'PhoneVerificationError';
  }
}

export interface PhoneVerificationRepository {
  request(phoneNumber: string, signal?: AbortSignal): Promise<PhoneVerificationChallenge>;
  verify(phoneNumber: string, code: string, signal?: AbortSignal): Promise<void>;
  clear(phoneNumber: string): Promise<void>;
}
