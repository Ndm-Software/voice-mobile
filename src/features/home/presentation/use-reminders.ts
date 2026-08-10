import { useCallback, useEffect, useState } from 'react';

import type { GetReminders } from '@/application/reminder';
import type { Reminder } from '@/domain/models/reminder';

type ReminderState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: readonly Reminder[] }
  | { readonly status: 'error' };

export function useReminders(getReminders?: GetReminders) {
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<ReminderState>(() =>
    getReminders ? { status: 'loading' } : { status: 'ready', data: [] },
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!getReminders) {
      return;
    }

    const controller = new AbortController();

    getReminders.execute(undefined, 'active', controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'ready', data });
          setRefreshing(false);
        }
      },
      (error: unknown) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof Error && error.name === 'AbortError')
        ) {
          setState({ status: 'error' });
          setRefreshing(false);
        }
      },
    );

    return () => controller.abort();
  }, [getReminders, requestKey]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequestKey((current) => current + 1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRequestKey((current) => current + 1);
  }, []);

  return { refreshing, refresh, retry, state };
}
