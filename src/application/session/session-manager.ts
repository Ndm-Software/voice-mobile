import { isRefreshTokenUsable, isSession, type Session } from '@/domain/models/session';
import type { SecureStorage } from '@/core/storage/secure-storage';

export const SESSION_STORAGE_KEY = 'voia.session.v2';
const LEGACY_SESSION_STORAGE_KEY = 'voia.session.v1';

export interface SessionManagerOptions {
  readonly now?: () => Date;
  readonly storage: SecureStorage;
}

export class SessionManager {
  private readonly now: () => Date;

  private readonly storage: SecureStorage;

  constructor({ now = () => new Date(), storage }: SessionManagerOptions) {
    this.now = now;
    this.storage = storage;
  }

  async restore(): Promise<Session | null> {
    const raw = await this.storage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
      const legacy = await this.storage.getItem(LEGACY_SESSION_STORAGE_KEY);
      if (legacy) {
        await this.storage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      }
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (!isSession(parsed) || !isRefreshTokenUsable(parsed, this.now())) {
        await this.clear();
        return null;
      }

      return parsed;
    } catch {
      await this.clear();
      return null;
    }
  }

  async save(session: Session): Promise<void> {
    if (!isSession(session)) {
      throw new Error('Geçersiz oturum verisi saklanamaz.');
    }

    await this.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.storage.removeItem(SESSION_STORAGE_KEY),
      this.storage.removeItem(LEGACY_SESSION_STORAGE_KEY),
    ]);
  }
}
