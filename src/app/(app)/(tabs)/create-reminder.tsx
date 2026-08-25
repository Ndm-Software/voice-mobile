import { useLocalSearchParams } from 'expo-router';

import { appContainer } from '@/composition/app-container';
import { dateFromKey } from '@/features/calendar/domain/calendar';
import { CreateReminderScreen } from '@/features/reminders/presentation/create-reminder-screen';

export default function CreateReminderRoute() {
  const params = useLocalSearchParams<{ readonly initialDate?: string | string[] }>();
  const initialDateValue = Array.isArray(params.initialDate)
    ? params.initialDate[0]
    : params.initialDate;
  const initialDate = initialDateValue ? dateFromKey(initialDateValue) : undefined;

  return (
    <CreateReminderScreen
      createReminder={appContainer.createReminder}
      initialDate={initialDate}
      key={initialDateValue ?? 'new-reminder'}
    />
  );
}
