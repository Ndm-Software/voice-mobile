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

interface RegistrationAcknowledgementDto {
  readonly expiresInSeconds: number;
  readonly message: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export class HttpPhoneVerificationRepository implements PhoneVerificationRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly endpoints: PhoneVerificationEndpoints,
  ) {}

  async request(phoneNumber: string, signal?: AbortSignal): Promise<PhoneVerificationChallenge> {
    try {
      const dto = await this.httpClient.post<RegistrationAcknowledgementDto>(
        this.endpoints.request,
        { phoneNumber },
        { signal },
      );
      if (!Number.isFinite(dto.expiresInSeconds) || dto.expiresInSeconds <= 0) {
        throw new PhoneVerificationError(
          'OTP_CONTRACT_INVALID',
          'Doğrulama kodunun geçerlilik süresi alınamadı.',
        );
      }
      const now = Date.now();
      return {
        id: phoneNumber,
        maskedPhoneNumber: maskPhoneNumber(phoneNumber),
        expiresAt: new Date(now + dto.expiresInSeconds * 1000).toISOString(),
        resendAvailableAt: new Date(
          now + Math.min(RESEND_COOLDOWN_SECONDS, dto.expiresInSeconds) * 1000,
        ).toISOString(),
      };
    } catch (error) {
      throw mapPhoneVerificationError(error);
    }
  }

  async verify(phoneNumber: string, code: string, signal?: AbortSignal): Promise<void> {
    try {
      await this.httpClient.post<unknown>(this.endpoints.verify, { phoneNumber, code }, { signal });
    } catch (error) {
      throw mapPhoneVerificationError(error);
    }
  }

  clear(_phoneNumber: string): Promise<void> {
    return Promise.resolve();
  }
}

function maskPhoneNumber(phoneNumber: string): string {
  const visibleSuffix = phoneNumber.slice(-2);
  return `${phoneNumber.slice(0, 3)} ••• ••• •• ${visibleSuffix}`;
}

function mapPhoneVerificationError(error: unknown): Error {
  if (error instanceof HttpError) {
    if (error.status === 429) {
      return new PhoneVerificationError(
        'OTP_RATE_LIMITED',
        'Çok fazla istek yapıldı. Bir süre sonra tekrar deneyin.',
      );
    }
    if ([400, 401, 409, 422].includes(error.status)) {
      return new PhoneVerificationError(
        'OTP_REJECTED',
        'Kod doğrulanamadı. Bilgileri kontrol edip tekrar deneyin.',
      );
    }
  }

  return error instanceof Error ? error : new Error('Telefon doğrulama isteği tamamlanamadı.');
}
