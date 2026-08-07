import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import {
  MockAuthAccountStore,
  type PasswordHasher,
} from '@/infrastructure/mock/auth/mock-auth-account-store';
import { MockNetwork } from '@/infrastructure/mock/mock-network';

import {
  DEVELOPMENT_OTP_CODE,
  MOCK_PHONE_VERIFICATION_STORAGE_KEY,
  MockPhoneVerificationRepository,
  OTP_EXPIRY_MS,
} from './mock-phone-verification-repository';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const hasher: PasswordHasher = { hash: async (value) => `hash:${value}` };

async function createFixture() {
  const storage = new MemoryStorage();
  const accountStore = new MockAuthAccountStore(storage, hasher);
  const account = await accountStore.register({
    firstName: 'Selin',
    lastName: 'Aydın',
    email: 'selin@example.com',
    phoneNumber: '+905551112233',
    password: 'Guclu123',
  });
  let now = new Date('2026-08-06T09:00:00.000Z');
  let sequence = 0;
  const repository = new MockPhoneVerificationRepository(
    new MockNetwork({ minimumDelayMs: 0, maximumDelayMs: 0, scenario: 'success' }),
    storage,
    accountStore,
    () => now,
    () => `challenge-${++sequence}`,
    hasher,
  );

  return {
    account,
    accountStore,
    repository,
    setNow(value: Date) {
      now = value;
    },
    storage,
  };
}

describe('MockPhoneVerificationRepository', () => {
  it('development challenge üretir fakat OTP kodunu depoya düz metin yazmaz', async () => {
    const { account, repository, storage } = await createFixture();

    await expect(repository.request(account.userId, account.phoneNumber)).resolves.toMatchObject({
      id: 'challenge-1',
      developmentCode: DEVELOPMENT_OTP_CODE,
      remainingAttempts: 5,
    });
    const persisted = JSON.parse(
      storage.values.get(MOCK_PHONE_VERIFICATION_STORAGE_KEY) ?? '{}',
    ) as { challenges: Record<string, { codeHash: string }> };
    expect(persisted.challenges[account.userId].codeHash).not.toBe(DEVELOPMENT_OTP_CODE);
  });

  it('hatalı kodda deneme sayısını kalıcı azaltır ve doğru kodda hesabı doğrular', async () => {
    const { account, accountStore, repository } = await createFixture();
    const challenge = await repository.request(account.userId, account.phoneNumber);

    await expect(repository.verify(account.userId, challenge.id, '000000')).rejects.toMatchObject({
      code: 'OTP_INVALID',
      remainingAttempts: 4,
    });
    await expect(
      repository.verify(account.userId, challenge.id, DEVELOPMENT_OTP_CODE),
    ).resolves.toBeUndefined();
    await expect(accountStore.findByUserId(account.userId)).resolves.toMatchObject({
      phoneVerified: true,
    });
  });

  it('cooldown sırasında aynı challenge döndürür; süre sonrasında yeni kod isteği üretir', async () => {
    const { account, repository, setNow } = await createFixture();
    const first = await repository.request(account.userId, account.phoneNumber);
    const same = await repository.request(account.userId, account.phoneNumber);
    expect(same.id).toBe(first.id);

    setNow(new Date('2026-08-06T09:00:31.000Z'));
    await expect(repository.request(account.userId, account.phoneNumber)).resolves.toMatchObject({
      id: 'challenge-2',
      remainingAttempts: 5,
    });
  });

  it('süresi geçen kodu reddeder', async () => {
    const { account, repository, setNow } = await createFixture();
    const challenge = await repository.request(account.userId, account.phoneNumber);
    setNow(new Date(new Date('2026-08-06T09:00:00.000Z').getTime() + OTP_EXPIRY_MS));

    await expect(
      repository.verify(account.userId, challenge.id, DEVELOPMENT_OTP_CODE),
    ).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  });
});
