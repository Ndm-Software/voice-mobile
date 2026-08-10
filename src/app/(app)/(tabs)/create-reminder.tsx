import { appContainer } from '@/composition/app-container';
import { CreateReminderScreen } from '@/features/reminders/presentation/create-reminder-screen';

export default function CreateReminderRoute() {
  return <CreateReminderScreen createReminder={appContainer.createReminder} />;
}
