import type {
  PhoneVerificationChallenge,
  PhoneVerificationRepository,
} from '@/domain/repositories/phone-verification-repository';

export interface RequestPhoneVerification {
  execute(
    userId: string,
    phoneNumber: string,
    signal?: AbortSignal,
  ): Promise<PhoneVerificationChallenge>;
}

export class RequestPhoneVerificationUseCase implements RequestPhoneVerification {
  constructor(private readonly repository: PhoneVerificationRepository) {}

  execute(
    userId: string,
    phoneNumber: string,
    signal?: AbortSignal,
  ): Promise<PhoneVerificationChallenge> {
    if (!userId || !phoneNumber) {
      throw new Error('Telefon doğrulaması için kullanıcı ve telefon bilgisi gereklidir.');
    }

    return this.repository.request(userId, phoneNumber, signal);
  }
}
