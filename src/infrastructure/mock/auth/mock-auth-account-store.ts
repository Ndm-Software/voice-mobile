import * as Crypto from 'expo-crypto';

import type { KeyValueStorage } from '@/core/storage/key-value-storage';
import { AuthRequestError, type RegisterInput } from '@/domain/repositories/auth-repository';
import type { UpdateProfileInput } from '@/domain/repositories/user-repository';

// SecureStore anahtarları yalnız alfanümerik, nokta, tire ve alt çizgi karakterlerini kabul eder.
export const MOCK_AUTH_STORAGE_KEY = 'voia.mock-auth.v1';
export const MOCK_AUTH_SCHEMA_VERSION = 2;

export interface MockAuthAccount {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly phoneVerified: boolean;
  readonly passwordHash: string;
}

interface PersistedMockAuthState {
  readonly schemaVersion: typeof MOCK_AUTH_SCHEMA_VERSION;
  readonly accounts: MockAuthAccount[];
  readonly resetTokens: Record<string, string>;
}

export interface PasswordHasher {
  hash(value: string): Promise<string>;
}

export class ExpoPasswordHasher implements PasswordHasher {
  hash(value: string): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
  }
}

function cloneState(state: PersistedMockAuthState): PersistedMockAuthState {
  return JSON.parse(JSON.stringify(state)) as PersistedMockAuthState;
}

function migrateState(value: unknown): PersistedMockAuthState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as {
    readonly schemaVersion?: unknown;
    readonly accounts?: unknown;
    readonly resetTokens?: unknown;
  };
  if (
    (candidate.schemaVersion !== 1 && candidate.schemaVersion !== MOCK_AUTH_SCHEMA_VERSION) ||
    !Array.isArray(candidate.accounts) ||
    !candidate.accounts.every(isAccountBase) ||
    !candidate.resetTokens ||
    typeof candidate.resetTokens !== 'object'
  ) {
    return null;
  }

  return {
    schemaVersion: MOCK_AUTH_SCHEMA_VERSION,
    accounts: candidate.accounts.map((account) => ({
      ...account,
      phoneVerified:
        typeof account.phoneVerified === 'boolean'
          ? account.phoneVerified
          : account.userId === '1001',
    })),
    resetTokens: candidate.resetTokens as Record<string, string>,
  };
}

export class MockAuthAccountStore {
  private state?: PersistedMockAuthState;
  private loading?: Promise<PersistedMockAuthState>;

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly hasher: PasswordHasher = new ExpoPasswordHasher(),
  ) {}

  async findByEmail(email: string): Promise<MockAuthAccount | undefined> {
    const state = await this.read();
    return state.accounts.find((account) => account.email === email);
  }

  async findByUserId(userId: string): Promise<MockAuthAccount | undefined> {
    const state = await this.read();
    return state.accounts.find((account) => account.userId === userId);
  }

  async verifyPassword(account: MockAuthAccount, password: string): Promise<boolean> {
    return (await this.hasher.hash(password)) === account.passwordHash;
  }

  async register(input: RegisterInput): Promise<MockAuthAccount> {
    const state = await this.read();
    if (state.accounts.some((account) => account.email === input.email)) {
      throw new AuthRequestError('EMAIL_ALREADY_EXISTS', 'Bu e-posta adresi zaten kayıtlı.', {
        email: 'Bu e-posta adresi zaten kayıtlı.',
      });
    }

    const nextAccount: MockAuthAccount = {
      userId: `mock-user-${Date.now()}`,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      phoneVerified: false,
      passwordHash: await this.hasher.hash(input.password),
    };
    const nextState: PersistedMockAuthState = {
      ...state,
      accounts: [...state.accounts, nextAccount],
    };
    await this.write(nextState);
    return nextAccount;
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const state = await this.read();
    const userId = state.resetTokens[token];
    if (!userId) {
      throw new AuthRequestError(
        'RESET_TOKEN_INVALID',
        'Şifre yenileme bağlantısı geçersiz veya süresi dolmuş.',
        { form: 'Yeni bir şifre sıfırlama bağlantısı isteyin.' },
      );
    }

    const passwordHash = await this.hasher.hash(password);
    const nextState: PersistedMockAuthState = {
      ...state,
      accounts: state.accounts.map((account) =>
        account.userId === userId ? { ...account, passwordHash } : account,
      ),
      resetTokens: Object.fromEntries(
        Object.entries(state.resetTokens).filter(([candidate]) => candidate !== token),
      ),
    };
    await this.write(nextState);
  }

  async issueResetToken(token: string, userId: string): Promise<void> {
    const state = await this.read();
    await this.write({
      ...state,
      resetTokens: { ...state.resetTokens, [token]: userId },
    });
  }

  async markPhoneVerified(userId: string): Promise<void> {
    const state = await this.read();
    if (!state.accounts.some((account) => account.userId === userId)) {
      throw new AuthRequestError('ACCOUNT_NOT_FOUND', 'Doğrulanacak hesap bulunamadı.');
    }

    await this.write({
      ...state,
      accounts: state.accounts.map((account) =>
        account.userId === userId ? { ...account, phoneVerified: true } : account,
      ),
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<MockAuthAccount> {
    const state = await this.read();
    const current = state.accounts.find((account) => account.userId === userId);
    if (!current) {
      throw new AuthRequestError('ACCOUNT_NOT_FOUND', 'Hesap bulunamadı.');
    }
    if (
      state.accounts.some((account) => account.userId !== userId && account.email === input.email)
    ) {
      throw new AuthRequestError('EMAIL_ALREADY_EXISTS', 'Bu e-posta adresi zaten kayıtlı.', {
        email: 'Bu e-posta adresi zaten kayıtlı.',
      });
    }
    const updated = { ...current, ...input };
    await this.write({
      ...state,
      accounts: state.accounts.map((account) => (account.userId === userId ? updated : account)),
    });
    return updated;
  }

  async deleteAccount(userId: string): Promise<void> {
    const state = await this.read();
    await this.write({
      ...state,
      accounts: state.accounts.filter((account) => account.userId !== userId),
      resetTokens: Object.fromEntries(
        Object.entries(state.resetTokens).filter(([, candidate]) => candidate !== userId),
      ),
    });
  }

  private async read(): Promise<PersistedMockAuthState> {
    if (this.state) {
      return cloneState(this.state);
    }

    this.loading ??= this.load();
    this.state = await this.loading;
    this.loading = undefined;
    return cloneState(this.state);
  }

  private async write(state: PersistedMockAuthState): Promise<void> {
    const nextState = cloneState(state);
    await this.storage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(nextState));
    this.state = nextState;
  }

  private async load(): Promise<PersistedMockAuthState> {
    const stored = await this.storage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        const migrated = migrateState(parsed);
        if (migrated) {
          if ((parsed as { schemaVersion?: unknown }).schemaVersion !== MOCK_AUTH_SCHEMA_VERSION) {
            await this.storage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(migrated));
          }
          return migrated;
        }
      } catch {
        // Bozuk veya eski mock kimlik verisi güvenli fixture ile yenilenir.
      }
    }

    const fixture: PersistedMockAuthState = {
      schemaVersion: MOCK_AUTH_SCHEMA_VERSION,
      accounts: [
        {
          userId: '1001',
          firstName: 'Uğur',
          lastName: 'Yılmaz',
          email: 'ugur@example.com',
          phoneNumber: '+905551112233',
          phoneVerified: true,
          passwordHash: await this.hasher.hash('Voia1234!'),
        },
      ],
      resetTokens: { 'mock-password-reset-token': '1001' },
    };
    await this.storage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(fixture));
    return fixture;
  }
}

function isAccountBase(value: unknown): value is Omit<MockAuthAccount, 'phoneVerified'> & {
  readonly phoneVerified?: boolean;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const account = value as Partial<MockAuthAccount>;
  return [
    account.userId,
    account.firstName,
    account.lastName,
    account.email,
    account.phoneNumber,
    account.passwordHash,
  ].every((field) => typeof field === 'string' && field.length > 0);
}
