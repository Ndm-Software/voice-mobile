import type {
  PhoneVerificationChallenge,
  PhoneVerificationRepository,
} from '@/domain/repositories/phone-verification-repository';

export interface RequestPhoneVerification {
  execute(phoneNumber: string, signal?: AbortSignal): Promise<PhoneVerificationChallenge>;
}

export class RequestPhoneVerificationUseCase implements RequestPhoneVerification {
  constructor(private readonly repository: PhoneVerificationRepository) {}

  execute(phoneNumber: string, signal?: AbortSignal): Promise<PhoneVerificationChallenge> {
    if (!phoneNumber) {
      throw new Error('Telefon doğrulaması için telefon bilgisi gereklidir.');
    }

    return this.repository.request(phoneNumber, signal);
  }
}
