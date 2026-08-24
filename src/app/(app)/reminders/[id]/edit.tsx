import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { useSession } from '@/application/session';
import { Screen, StateView } from '@/components';
import { appContainer } from '@/composition/app-container';
import type { Reminder } from '@/domain/models/reminder';
import { EditReminderScreen } from '@/features/reminders/presentation/edit-reminder-screen';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly reminder: Reminder }
  | { readonly status: 'error' };

export default function EditReminderRoute() {
  const params = useLocalSearchParams<{ readonly id?: string | string[] }>();
  const { session } = useSession();
  const reminderId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    appContainer.getReminderDetails
      .execute(session?.userId ?? '', reminderId, controller.signal)
      .then(
        (reminder) => {
          if (!controller.signal.aborted) setState({ status: 'ready', reminder });
        },
        (error: unknown) => {
          if (
            !controller.signal.aborted &&
            !(error instanceof Error && error.name === 'AbortError')
          ) {
            setState({ status: 'error' });
          }
        },
      );
    return () => controller.abort();
  }, [reminderId, requestKey, session?.userId]);

  if (state.status === 'ready') {
    return (
      <EditReminderScreen reminder={state.reminder} updateReminder={appContainer.updateReminder} />
    );
  }

  return (
    <Screen title="Hatırlatıcıyı düzenle">
      {state.status === 'loading' ? <StateView variant="loading" /> : null}
      {state.status === 'error' ? (
        <StateView
          actionLabel="Tekrar dene"
          description="Hatırlatıcı bilgileri alınamadı."
          onAction={() => {
            setState({ status: 'loading' });
            setRequestKey((current) => current + 1);
          }}
          title="Düzenleme açılamadı"
          variant="error"
        />
      ) : null}
    </Screen>
  );
}
