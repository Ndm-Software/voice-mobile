import { useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Linking } from 'react-native';

import { useSession } from '@/application/session';
import type { PushNotificationManager } from '@/application/session/push-notification-manager';
import { useToast } from '@/components';
import { routes } from '@/config/routes';
import type {
  PushNotificationMessage,
  PushNotificationPermission,
} from '@/domain/repositories/push-notification-gateway';

interface PushNotificationContextValue {
  readonly error: Error | null;
  readonly loading: boolean;
  readonly openSystemSettings: () => Promise<void>;
  readonly permission: PushNotificationPermission;
  readonly requestPermission: () => Promise<void>;
  readonly synchronize: () => Promise<void>;
  readonly tokenRegistered: boolean;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

interface PushNotificationProviderProps extends PropsWithChildren {
  readonly manager: PushNotificationManager;
}

export function PushNotificationProvider({ children, manager }: PushNotificationProviderProps) {
  const router = useRouter();
  const { session, status } = useSession();
  const { showToast } = useToast();
  const handledMessageIds = useRef(new Set<string>());
  const [permission, setPermission] = useState<PushNotificationPermission>('not-determined');
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const applySynchronization = useCallback(
    async (requestPermission: boolean) => {
      if (!session) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await manager.synchronize(session, { requestPermission });
        setPermission(result.permission);
        setTokenRegistered(result.tokenRegistered);
      } catch (syncError) {
        setTokenRegistered(false);
        setError(toPublicError(syncError));
      } finally {
        setLoading(false);
      }
    },
    [manager, session],
  );

  const openReminder = useCallback(
    (message: PushNotificationMessage) => {
      if (!message.reminderId) {
        return;
      }
      if (message.messageId && handledMessageIds.current.has(message.messageId)) {
        return;
      }
      if (message.messageId) {
        handledMessageIds.current.add(message.messageId);
      }
      router.push(routes.reminderDetails(message.reminderId));
    },
    [router],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return;
    }

    let active = true;
    void manager
      .synchronize(session)
      .then((result) => {
        if (!active) {
          return;
        }
        setPermission(result.permission);
        setTokenRegistered(result.tokenRegistered);
        setError(null);
      })
      .catch((syncError: unknown) => {
        if (active) {
          setTokenRegistered(false);
          setError(toPublicError(syncError));
        }
      });
    const unsubscribe = manager.subscribe(session, {
      onError: (subscriptionError) => setError(toPublicError(subscriptionError)),
      onForegroundMessage: (message) => {
        showToast(`${message.title}: ${message.body}`);
      },
      onOpenedMessage: openReminder,
      onTokenRegistered: () => setTokenRegistered(true),
    });
    void manager
      .getInitialMessage()
      .then((message) => {
        if (message) {
          openReminder(message);
        }
      })
      .catch((initialError: unknown) => setError(toPublicError(initialError)));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [manager, openReminder, session, showToast, status]);

  const value = useMemo<PushNotificationContextValue>(
    () => ({
      error,
      loading,
      openSystemSettings: async () => {
        await Linking.openSettings();
      },
      permission,
      requestPermission: () => applySynchronization(true),
      synchronize: () => applySynchronization(false),
      tokenRegistered,
    }),
    [applySynchronization, error, loading, permission, tokenRegistered],
  );

  return (
    <PushNotificationContext.Provider value={value}>{children}</PushNotificationContext.Provider>
  );
}

export function usePushNotifications(): PushNotificationContextValue {
  const value = useContext(PushNotificationContext);
  if (!value) {
    throw new Error('usePushNotifications, PushNotificationProvider içinde kullanılmalıdır.');
  }
  return value;
}

function toPublicError(error: unknown): Error {
  return error instanceof Error
    ? new Error('Bildirim bağlantısı kurulamadı.', { cause: error })
    : new Error('Bildirim bağlantısı kurulamadı.');
}
