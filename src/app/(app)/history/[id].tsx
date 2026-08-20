import { useLocalSearchParams } from 'expo-router';

import { appContainer } from '@/composition/app-container';
import { HistoryDetailScreen } from '@/features/history';

export default function HistoryDetailRoute() {
  const params = useLocalSearchParams<{ readonly id?: string | string[] }>();
  const historyId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  return (
    <HistoryDetailScreen
      deleteReminderHistory={appContainer.deleteReminderHistory}
      getReminderHistoryDetails={appContainer.getReminderHistoryDetails}
      historyId={historyId}
    />
  );
}
