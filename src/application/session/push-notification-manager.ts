import type { Session } from '@/domain/models/session';
import type {
  PushNotificationGateway,
  PushNotificationMessage,
  PushNotificationPermission,
} from '@/domain/repositories/push-notification-gateway';

import { DeviceSessionManager } from './device-session-manager';

export interface PushNotificationSyncResult {
  readonly permission: PushNotificationPermission;
  readonly tokenRegistered: boolean;
}

interface PushNotificationListeners {
  readonly onError: (error: Error) => void;
  readonly onForegroundMessage: (message: PushNotificationMessage) => void;
  readonly onOpenedMessage: (message: PushNotificationMessage) => void;
  readonly onTokenRegistered: () => void;
}

export class PushNotificationManager {
  constructor(
    private readonly gateway: PushNotificationGateway,
    private readonly deviceSessions: DeviceSessionManager,
  ) {}

  async synchronize(
    session: Session,
    options: { requestPermission?: boolean } = {},
  ): Promise<PushNotificationSyncResult> {
    const permission = options.requestPermission
      ? await this.gateway.requestPermission()
      : await this.gateway.getPermissionStatus();

    if (permission !== 'granted') {
      if (permission === 'denied') {
        await this.deviceSessions.updatePushToken(session, null);
      }
      return { permission, tokenRegistered: false };
    }

    const token = await this.gateway.getToken();
    if (!token) {
      return { permission, tokenRegistered: false };
    }

    await this.deviceSessions.updatePushToken(session, token);
    return { permission, tokenRegistered: true };
  }

  subscribe(session: Session, listeners: PushNotificationListeners): () => void {
    const unsubscribeToken = this.gateway.subscribeToTokenRefresh((token) => {
      void this.deviceSessions
        .updatePushToken(session, token)
        .then(listeners.onTokenRegistered)
        .catch((error: unknown) => listeners.onError(toError(error)));
    });
    const unsubscribeForeground = this.gateway.subscribeToForegroundMessages(
      listeners.onForegroundMessage,
    );
    const unsubscribeOpened = this.gateway.subscribeToOpenedMessages(listeners.onOpenedMessage);

    return () => {
      unsubscribeToken();
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }

  getInitialMessage(): Promise<PushNotificationMessage | null> {
    return this.gateway.getInitialMessage();
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Bildirim işlemi tamamlanamadı.');
}
