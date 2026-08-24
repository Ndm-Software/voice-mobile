import { appContainer } from '@/composition/app-container';
import { HistoryScreen } from '@/features/history';

export default function HistoryRoute() {
  return <HistoryScreen getReminderHistory={appContainer.getReminderHistory} />;
}
