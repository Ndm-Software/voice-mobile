import type { Session } from '@/domain/models/session';

export type RefreshSession = (session: Session) => Promise<Session>;

export class RefreshCoordinator {
  private inFlight: Promise<Session> | null = null;

  constructor(private readonly refreshSession: RefreshSession) {}

  refresh(session: Session): Promise<Session> {
    if (!this.inFlight) {
      this.inFlight = this.refreshSession(session).finally(() => {
        this.inFlight = null;
      });
    }

    return this.inFlight;
  }
}
