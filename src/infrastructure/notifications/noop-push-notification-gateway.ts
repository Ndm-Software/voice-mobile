import type {
  PushNotificationGateway,
  PushNotificationMessage,
  PushNotificationPermission,
} from '@/domain/repositories/push-notification-gateway';

const noop = () => undefined;

export class NoopPushNotificationGateway implements PushNotificationGateway {
  getInitialMessage(): Promise<null> {
    return Promise.resolve(null);
  }

  getPermissionStatus(): Promise<PushNotificationPermission> {
    return Promise.resolve('not-determined');
  }

  getToken(): Promise<null> {
    return Promise.resolve(null);
  }

  requestPermission(): Promise<PushNotificationPermission> {
    return Promise.resolve('not-determined');
  }

  subscribeToForegroundMessages(_listener: (message: PushNotificationMessage) => void): () => void {
    return noop;
  }

  subscribeToOpenedMessages(_listener: (message: PushNotificationMessage) => void): () => void {
    return noop;
  }

  subscribeToTokenRefresh(_listener: (token: string) => void): () => void {
    return noop;
  }
}
