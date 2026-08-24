import type { SecureStorage } from '@/core/storage/secure-storage';

import { SESSION_STORAGE_KEY, SessionManager } from './session-manager';

function createStorage(initial: Record<string, string> = {}): SecureStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

const validSession = {
  userId: 'user-1',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-03T10:00:00.000Z',
} as const;

describe('SessionManager', () => {
  it('SecureStore tarafından kabul edilen bir anahtar kullanır', () => {
    expect(SESSION_STORAGE_KEY).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  it('geçerli oturumu geri yükler ve güvenli depoya yazar', async () => {
    const storage = createStorage();
    const manager = new SessionManager({
      now: () => new Date('2026-08-03T09:00:00.000Z'),
      storage,
    });

    await manager.save(validSession);

    await expect(manager.restore()).resolves.toEqual(validSession);
    expect(storage.setItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY, JSON.stringify(validSession));
  });

  it('süresi dolmuş veya bozuk oturumu temizler', async () => {
    const storage = createStorage({
      [SESSION_STORAGE_KEY]: JSON.stringify({
        ...validSession,
        refreshTokenExpiresAt: '2026-08-02T10:00:00.000Z',
      }),
    });
    const manager = new SessionManager({
      now: () => new Date('2026-08-03T09:00:00.000Z'),
      storage,
    });

    await expect(manager.restore()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
  });

  it('JSON bozulduğunda uygulamayı çökertmeden temiz başlangıç döner', async () => {
    const storage = createStorage({ [SESSION_STORAGE_KEY]: '{bozuk-json' });
    const manager = new SessionManager({ storage });

    await expect(manager.restore()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
  });

  it('UUID geçişinden önceki v1 oturumunu temizleyip yeniden giriş ister', async () => {
    const storage = createStorage({
      'voia.session.v1': JSON.stringify(validSession),
    });
    const manager = new SessionManager({ storage });

    await expect(manager.restore()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('voia.session.v1');
  });
});
