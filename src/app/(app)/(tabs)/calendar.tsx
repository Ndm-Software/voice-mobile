import { useSession } from '@/application/session';
import { appContainer } from '@/composition/app-container';
import { CalendarScreen } from '@/features/calendar/presentation/calendar-screen';

export default function CalendarRoute() {
  const { session } = useSession();
  return <CalendarScreen getReminders={appContainer.getReminders} userId={session?.userId ?? ''} />;
}
