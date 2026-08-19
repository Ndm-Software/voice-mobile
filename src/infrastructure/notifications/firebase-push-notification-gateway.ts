import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import type {
  PushNotificationGateway,
  PushNotificationMessage,
  PushNotificationPermission,
} from '@/domain/repositories/push-notification-gateway';

export class FirebasePushNotificationGateway implements PushNotificationGateway {
  async getPermissionStatus(): Promise<PushNotificationPermission> {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < 33) {
        return 'granted';
      }
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted ? 'granted' : 'denied';
    }

    return mapAuthorizationStatus(await hasPermission(getMessaging()));
  }

  async requestPermission(): Promise<PushNotificationPermission> {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < 33) {
        return 'granted';
      }
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    }

    return mapAuthorizationStatus(await requestPermission(getMessaging()));
  }

  async getToken(): Promise<string | null> {
    const messaging = getMessaging();
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);
    }
    const token = await getToken(messaging);
    return token.trim() || null;
  }

  subscribeToTokenRefresh(listener: (token: string) => void): () => void {
    return onTokenRefresh(getMessaging(), listener);
  }

  subscribeToForegroundMessages(listener: (message: PushNotificationMessage) => void): () => void {
    return onMessage(getMessaging(), (message) => listener(mapMessage(message)));
  }

  subscribeToOpenedMessages(listener: (message: PushNotificationMessage) => void): () => void {
    return onNotificationOpenedApp(getMessaging(), (message) => listener(mapMessage(message)));
  }

  async getInitialMessage(): Promise<PushNotificationMessage | null> {
    const message = await getInitialNotification(getMessaging());
    return message ? mapMessage(message) : null;
  }
}

function mapAuthorizationStatus(status: number): PushNotificationPermission {
  if (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL ||
    status === AuthorizationStatus.EPHEMERAL
  ) {
    return 'granted';
  }
  return status === AuthorizationStatus.DENIED ? 'denied' : 'not-determined';
}

export function mapRemoteMessage(message: RemoteMessage): PushNotificationMessage {
  return mapMessage(message);
}

function mapMessage(message: RemoteMessage): PushNotificationMessage {
  const data = message.data;
  const title = message.notification?.title ?? stringValue(data?.title) ?? 'Voia';
  const body =
    message.notification?.body ?? stringValue(data?.body) ?? 'Hatırlatıcının zamanı yaklaşıyor.';
  const reminderId = stringValue(data?.reminderId);

  return {
    title,
    body,
    ...(message.messageId ? { messageId: message.messageId } : {}),
    ...(reminderId ? { reminderId } : {}),
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
