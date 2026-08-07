import * as Crypto from 'expo-crypto';

import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import type {
  PhoneVerificationChallenge,
  PhoneVerificationRepository,
} from '@/domain/repositories/phone-verification-repository';
import { PhoneVerificationError } from '@/domain/repositories/phone-verification-repository';
import {
  ExpoPasswordHasher,
  type MockAuthAccountStore,
  type PasswordHasher,
} from '@/infrastructure/mock/auth/mock-auth-account-store';
import { MockNetwork } from '@/infrastructure/mock/mock-network';

export const MOCK_PHONE_VERIFICATION_STORAGE_KEY = '@voia/mock-phone-verification/v1';
export const DEVELOPMENT_OTP_CODE = '123456';
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

interface StoredChallenge {
  readonly id: string;
  readonly userId: string;
  readonly phoneNumber: string;
  readonly codeHash: string;
  readonly expiresAt: string;
  readonly resendAvailableAt: string;
  readonly remainingAttempts: number;
  readonly createdAt: string;
}

interface StoredState {
  readonly schemaVersion: 1;
  readonly challenges: Record<string, StoredChallenge>;
}

export class MockPhoneVerificationRepository implements PhoneVerificationRepository {
  constructor(
    private readonly network: MockNetwork,
    private readonly storage: KeyValueStorage,
    private readonly accountStore: MockAuthAccountStore,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => Crypto.randomUUID(),
    private readonly hasher: PasswordHasher = new ExpoPasswordHasher(),
  ) {}

  request(
    userId: string,
    phoneNumber: string,
    signal?: AbortSignal,
  ): Promise<PhoneVerificationChallenge> {
    return this.network.run(async () => {
      const account = await this.accountStore.findByUserId(userId);
      if (!account || account.phoneNumber !== phoneNumber) {
        throw new PhoneVerificationError(
          'PHONE_ACCOUNT_MISMATCH',
          'Telefon doğrulama bilgileri hesapla eşleşmiyor.',
        );
      }

      const state = await this.read();
      const current = state.challenges[userId];
      const now = this.now();
      if (
        current &&
        Date.parse(current.expiresAt) > now.getTime() &&
        Date.parse(current.resendAvailableAt) > now.getTime()
      ) {
        return toPublicChallenge(current);
      }

      const challenge: StoredChallenge = {
        id: this.createId(),
        userId,
        phoneNumber,
        codeHash: await this.hasher.hash(DEVELOPMENT_OTP_CODE),
        expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS).toISOString(),
        resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS).toISOString(),
        remainingAttempts: OTP_MAX_ATTEMPTS,
        createdAt: now.toISOString(),
      };
      await this.write({
        ...state,
        challenges: { ...state.challenges, [userId]: challenge },
      });
      return toPublicChallenge(challenge);
    }, signal);
  }

  verify(userId: string, challengeId: string, code: string, signal?: AbortSignal): Promise<void> {
    return this.network.run(async () => {
      const state = await this.read();
      const challenge = state.challenges[userId];
      if (!challenge || challenge.id !== challengeId) {
        throw new PhoneVerificationError(
          'OTP_CHALLENGE_INVALID',
          'Doğrulama isteği bulunamadı. Yeni kod isteyin.',
        );
      }
      if (Date.parse(challenge.expiresAt) <= this.now().getTime()) {
        throw new PhoneVerificationError('OTP_EXPIRED', 'Kodun süresi doldu. Yeni kod isteyin.');
      }
      if (challenge.remainingAttempts <= 0) {
        throw new PhoneVerificationError(
          'OTP_ATTEMPTS_EXHAUSTED',
          'Deneme hakkınız doldu. Yeni kod isteyin.',
          0,
        );
      }

      const matches = (await this.hasher.hash(code)) === challenge.codeHash;
      if (!matches) {
        const remainingAttempts = challenge.remainingAttempts - 1;
        await this.write({
          ...state,
          challenges: {
            ...state.challenges,
            [userId]: { ...challenge, remainingAttempts },
          },
        });
        throw new PhoneVerificationError(
          remainingAttempts === 0 ? 'OTP_ATTEMPTS_EXHAUSTED' : 'OTP_INVALID',
          remainingAttempts === 0
            ? 'Deneme hakkınız doldu. Yeni kod isteyin.'
            : `Kod hatalı. ${remainingAttempts} deneme hakkınız kaldı.`,
          remainingAttempts,
        );
      }

      await this.accountStore.markPhoneVerified(userId);
      await this.clear(userId);
    }, signal);
  }

  async clear(userId: string): Promise<void> {
    const state = await this.read();
    const { [userId]: _removed, ...challenges } = state.challenges;
    await this.write({ ...state, challenges });
  }

  private async read(): Promise<StoredState> {
    const raw = await this.storage.getItem(MOCK_PHONE_VERIFICATION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StoredState>;
        if (
          parsed.schemaVersion === 1 &&
          parsed.challenges &&
          typeof parsed.challenges === 'object'
        ) {
          return parsed as StoredState;
        }
      } catch {
        // Bozuk development OTP verisi boş state ile onarılır.
      }
    }
    return { schemaVersion: 1, challenges: {} };
  }

  private write(state: StoredState): Promise<void> {
    return this.storage.setItem(MOCK_PHONE_VERIFICATION_STORAGE_KEY, JSON.stringify(state));
  }
}

function toPublicChallenge(challenge: StoredChallenge): PhoneVerificationChallenge {
  return {
    id: challenge.id,
    maskedPhoneNumber: maskPhoneNumber(challenge.phoneNumber),
    expiresAt: challenge.expiresAt,
    resendAvailableAt: challenge.resendAvailableAt,
    remainingAttempts: challenge.remainingAttempts,
    maxAttempts: OTP_MAX_ATTEMPTS,
    developmentCode: DEVELOPMENT_OTP_CODE,
  };
}

function maskPhoneNumber(phoneNumber: string): string {
  const visibleSuffix = phoneNumber.slice(-2);
  return `${phoneNumber.slice(0, 3)} ••• ••• •• ${visibleSuffix}`;
}
