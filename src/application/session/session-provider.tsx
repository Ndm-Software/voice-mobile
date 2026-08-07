import { usePathname, useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { routes } from '@/config/routes';
import { isAccessTokenUsable, type Session } from '@/domain/models/session';

import { RefreshCoordinator } from './refresh-coordinator';
import { SessionManager } from './session-manager';
import { DeviceSessionManager } from './device-session-manager';

export type SessionStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated' | 'error';

interface SessionContextValue {
  readonly error: Error | null;
  readonly isAuthenticated: boolean;
  readonly logout: () => Promise<void>;
  readonly refresh: () => Promise<void>;
  readonly retryBootstrap: () => void;
  readonly session: Session | null;
  readonly signIn: (session: Session) => Promise<void>;
  readonly signInDemo: () => Promise<void>;
  readonly status: SessionStatus;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function createDemoSession(now = new Date(), current?: Session): Session {
  const accessExpires = new Date(now.getTime() + 60 * 60 * 1000);
  const refreshExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    userId: current?.userId ?? 'mock-user-1',
    phoneNumber: current?.phoneNumber,
    phoneVerified: current?.phoneVerified,
    accessToken: `mock-access-${now.getTime()}`,
    refreshToken: `mock-refresh-${now.getTime()}`,
    accessTokenExpiresAt: accessExpires.toISOString(),
    refreshTokenExpiresAt: refreshExpires.toISOString(),
  };
}

interface SessionProviderProps extends PropsWithChildren {
  readonly deviceSessions: DeviceSessionManager;
  readonly manager: SessionManager;
}

export function SessionProvider({ children, deviceSessions, manager }: SessionProviderProps) {
  const refreshCoordinator = useMemo(
    () => new RefreshCoordinator(async (current) => createDemoSession(new Date(), current)),
    [],
  );
  const [status, setStatus] = useState<SessionStatus>('bootstrapping');
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [bootstrapVersion, setBootstrapVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setStatus('bootstrapping');
      setError(null);

      try {
        await deviceSessions.prepare();
        const restored = await manager.restore();
        if (!active) {
          return;
        }

        if (restored && !isAccessTokenUsable(restored)) {
          const renewed = await refreshCoordinator.refresh(restored);
          await manager.save(renewed);
          if (!active) {
            return;
          }
          setSession(renewed);
          setStatus('authenticated');
        } else {
          setSession(restored);
          setStatus(restored ? 'authenticated' : 'unauthenticated');
        }
      } catch (restoreError) {
        if (!active) {
          return;
        }
        setSession(null);
        setError(restoreError instanceof Error ? restoreError : new Error('Oturum okunamadı.'));
        setStatus('error');
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [bootstrapVersion, deviceSessions, manager, refreshCoordinator]);

  const signIn = useCallback(
    async (nextSession: Session) => {
      await deviceSessions.bind(nextSession);
      await manager.save(nextSession);
      setSession(nextSession);
      setError(null);
      setStatus('authenticated');
    },
    [deviceSessions, manager],
  );

  const signInDemo = useCallback(() => signIn(createDemoSession()), [signIn]);

  const logout = useCallback(async () => {
    if (session) {
      try {
        await deviceSessions.revoke(session);
      } catch {
        // Yerel çıkış, uzak cihaz revoke isteği başarısız olsa da tamamlanır.
      }
    }
    await manager.clear();
    setSession(null);
    setError(null);
    setStatus('unauthenticated');
  }, [deviceSessions, manager, session]);

  const refresh = useCallback(async () => {
    if (!session) {
      return;
    }

    const currentSession = session;
    const nextSession = await refreshCoordinator.refresh(currentSession);
    await manager.save(nextSession);
    setSession(nextSession);
    setStatus('authenticated');
  }, [manager, refreshCoordinator, session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      error,
      isAuthenticated: status === 'authenticated',
      logout,
      refresh,
      retryBootstrap: () => setBootstrapVersion((value) => value + 1),
      session,
      signIn,
      signInDemo,
      status,
    }),
    [error, logout, refresh, session, signIn, signInDemo, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error('useSession, SessionProvider içinde kullanılmalıdır.');
  }

  return value;
}

export function SessionGate({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, session, status } = useSession();

  useEffect(() => {
    if (status === 'bootstrapping') {
      if (pathname !== routes.splash) {
        router.replace(routes.splash);
      }
      return;
    }

    if (status === 'error') {
      if (pathname !== routes.splash) {
        router.replace(routes.splash);
      }
      return;
    }

    const isAuthRoute =
      pathname.startsWith('/welcome') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/register');
    const isAppRoute =
      pathname.startsWith('/home') ||
      pathname.startsWith('/calendar') ||
      pathname.startsWith('/create-reminder') ||
      pathname.startsWith('/history') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/preferences') ||
      pathname.startsWith('/quiet-hours') ||
      pathname.startsWith('/devices') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/component-gallery');
    const isPhoneVerificationRoute = pathname.startsWith('/verify-phone');
    const requiresPhoneVerification = session?.phoneVerified === false;

    if (isAuthenticated && requiresPhoneVerification && !isPhoneVerificationRoute) {
      router.replace(routes.verifyPhone);
    } else if (
      isAuthenticated &&
      !requiresPhoneVerification &&
      (isAuthRoute || isPhoneVerificationRoute)
    ) {
      router.replace(routes.home);
    } else if (!isAuthenticated && (isAppRoute || isPhoneVerificationRoute)) {
      router.replace(routes.welcome);
    } else if (pathname === routes.splash) {
      router.replace(isAuthenticated ? routes.home : routes.welcome);
    }
  }, [isAuthenticated, pathname, router, session, status]);

  return children;
}
