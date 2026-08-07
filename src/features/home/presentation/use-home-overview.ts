import { useCallback, useEffect, useState } from 'react';

import type { GetHomeOverview } from '@/application/use-cases/get-home-overview';
import type { HomeOverview } from '@/domain/models/home-overview';

type HomeOverviewState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: HomeOverview }
  | { readonly status: 'error' };

export function useHomeOverview(getHomeOverview: GetHomeOverview) {
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<HomeOverviewState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    getHomeOverview
      .execute(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [getHomeOverview, requestKey]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequestKey((current) => current + 1);
  }, []);

  return { retry, state };
}
