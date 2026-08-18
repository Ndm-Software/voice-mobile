import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { PendingRegistration } from '@/domain/repositories/auth-repository';

interface PendingRegistrationContextValue {
  readonly clearPendingRegistration: () => void;
  readonly pendingRegistration: PendingRegistration | null;
  readonly startPendingRegistration: (registration: PendingRegistration) => void;
}

const PendingRegistrationContext = createContext<PendingRegistrationContextValue | null>(null);

export function PendingRegistrationProvider({ children }: PropsWithChildren) {
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const startPendingRegistration = useCallback(
    (registration: PendingRegistration) => setPendingRegistration(registration),
    [],
  );
  const clearPendingRegistration = useCallback(() => setPendingRegistration(null), []);
  const value = useMemo(
    () => ({ clearPendingRegistration, pendingRegistration, startPendingRegistration }),
    [clearPendingRegistration, pendingRegistration, startPendingRegistration],
  );

  return (
    <PendingRegistrationContext.Provider value={value}>
      {children}
    </PendingRegistrationContext.Provider>
  );
}

export function usePendingRegistration(): PendingRegistrationContextValue {
  const value = useContext(PendingRegistrationContext);
  if (!value) {
    throw new Error('usePendingRegistration, PendingRegistrationProvider içinde kullanılmalıdır.');
  }
  return value;
}
