import { useLocalSearchParams } from 'expo-router';

import { useSession } from '@/application/session';
import { appContainer } from '@/composition/app-container';
import { ReminderDetailScreen } from '@/features/reminders/presentation/reminder-detail-screen';

export default function ReminderDetailRoute() {
  const params = useLocalSearchParams<{ readonly id?: string | string[] }>();
  const { session } = useSession();
  const reminderId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  return (
    <ReminderDetailScreen
      changeReminderStatus={appContainer.changeReminderStatus}
      deleteReminder={appContainer.deleteReminder}
      getReminderDetails={appContainer.getReminderDetails}
      reminderId={reminderId}
      userId={session?.userId ?? ''}
    />
  );
}
