import { appContainer } from '@/composition/app-container';
import { QuietHoursScreen } from '@/features/quiet-hours/presentation/quiet-hours-screen';

export default function QuietHoursRoute() {
  return (
    <QuietHoursScreen
      applyQuietHoursToAllDays={appContainer.applyQuietHoursToAllDays}
      deleteQuietHour={appContainer.deleteQuietHour}
      getPreferences={appContainer.getPreferences}
      getQuietHours={appContainer.getQuietHours}
      saveQuietHour={appContainer.saveQuietHour}
    />
  );
}
