import {
  PhoneVerificationError,
  type PhoneVerificationRepository,
} from '@/domain/repositories/phone-verification-repository';

export interface VerifyPhone {
  execute(userId: string, challengeId: string, code: string, signal?: AbortSignal): Promise<void>;
}

export class VerifyPhoneUseCase implements VerifyPhone {
  constructor(private readonly repository: PhoneVerificationRepository) {}

  execute(userId: string, challengeId: string, code: string, signal?: AbortSignal): Promise<void> {
    const normalizedCode = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new PhoneVerificationError('OTP_FORMAT_INVALID', 'Kod 6 rakamdan oluşmalıdır.');
    }

    return this.repository.verify(userId, challengeId, normalizedCode, signal);
  }
}
