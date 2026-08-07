import type {
  PhoneVerificationChallenge,
  PhoneVerificationRepository,
} from '@/domain/repositories/phone-verification-repository';
import { PhoneVerificationError } from '@/domain/repositories/phone-verification-repository';
import { HttpError, type HttpClient } from '@/infrastructure/http/http-client';

interface PhoneVerificationEndpoints {
  readonly request: string;
  readonly verify: string;
}

interface ChallengeDto {
  readonly challenge_id: string | number;
  readonly masked_phone_number: string;
  readonly expires_at: string;
  readonly resend_available_at: string;
  readonly remaining_attempts: number;
  readonly max_attempts: number;
}

export class HttpPhoneVerificationRepository implements PhoneVerificationRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: PhoneVerificationEndpoints,
  ) {}

  async request(
    _userId: string,
    phoneNumber: string,
    signal?: AbortSignal,
  ): Promise<PhoneVerificationChallenge> {
    try {
      const dto = await this.httpClient.post<ChallengeDto>(
        this.endpoints.request,
        { phone_number: phoneNumber, purpose: 'phone-verification' },
        { signal },
      );
      return {
        id: String(dto.challenge_id),
        maskedPhoneNumber: dto.masked_phone_number,
        expiresAt: dto.expires_at,
        resendAvailableAt: dto.resend_available_at,
        remainingAttempts: dto.remaining_attempts,
        maxAttempts: dto.max_attempts,
      };
    } catch (error) {
      throw mapPhoneVerificationError(error);
    }
  }

  async verify(
    _userId: string,
    challengeId: string,
    code: string,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      await this.httpClient.post<unknown>(
        this.endpoints.verify,
        { challenge_id: challengeId, code, purpose: 'phone-verification' },
        { signal },
      );
    } catch (error) {
      throw mapPhoneVerificationError(error);
    }
  }

  clear(_userId: string): Promise<void> {
    return Promise.resolve();
  }
}

function mapPhoneVerificationError(error: unknown): Error {
  if (error instanceof HttpError) {
    if (error.status === 429) {
      return new PhoneVerificationError(
        'OTP_RATE_LIMITED',
        'Çok fazla istek yapıldı. Bir süre sonra tekrar deneyin.',
      );
    }
    if (error.status === 400 || error.status === 401 || error.status === 422) {
      return new PhoneVerificationError(
        'OTP_REJECTED',
        'Kod doğrulanamadı. Bilgileri kontrol edip tekrar deneyin.',
      );
    }
  }

  return error instanceof Error ? error : new Error('Telefon doğrulama isteği tamamlanamadı.');
}
