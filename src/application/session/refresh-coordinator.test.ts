import type { Session } from '@/domain/models/session';

import { RefreshCoordinator } from './refresh-coordinator';

const session: Session = {
  userId: 'user-1',
  accessToken: 'old-access',
  refreshToken: 'refresh',
  accessTokenExpiresAt: '2026-08-03T10:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-03T10:00:00.000Z',
};

describe('RefreshCoordinator', () => {
  it('eşzamanlı refresh çağrılarını tek istekte birleştirir', async () => {
    let resolveRefresh!: (value: Session) => void;
    const refresh = jest.fn(
      () =>
        new Promise<Session>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const coordinator = new RefreshCoordinator(refresh);

    const first = coordinator.refresh(session);
    const second = coordinator.refresh(session);

    expect(refresh).toHaveBeenCalledTimes(1);
    resolveRefresh({ ...session, accessToken: 'new-access' });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ...session, accessToken: 'new-access' },
      { ...session, accessToken: 'new-access' },
    ]);
  });
});
