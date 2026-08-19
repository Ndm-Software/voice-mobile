export type PushNotificationPermission = 'denied' | 'granted' | 'not-determined';

export interface PushNotificationMessage {
  readonly body: string;
  readonly messageId?: string;
  readonly reminderId?: string;
  readonly title: string;
}

export type PushNotificationUnsubscribe = () => void;

export interface PushNotificationGateway {
  getInitialMessage(): Promise<PushNotificationMessage | null>;
  getPermissionStatus(): Promise<PushNotificationPermission>;
  getToken(): Promise<string | null>;
  requestPermission(): Promise<PushNotificationPermission>;
  subscribeToForegroundMessages(
    listener: (message: PushNotificationMessage) => void,
  ): PushNotificationUnsubscribe;
  subscribeToOpenedMessages(
    listener: (message: PushNotificationMessage) => void,
  ): PushNotificationUnsubscribe;
  subscribeToTokenRefresh(listener: (token: string) => void): PushNotificationUnsubscribe;
}
