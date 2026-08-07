import { FeatureShellScreen } from '@/features/navigation/presentation/feature-shell-screen';

export default function CreateReminderRoute() {
  return (
    <FeatureShellScreen
      description="Push ve sesli arama seçenekleriyle yeni hatırlatıcı oluştur."
      icon="add"
      title="Yeni hatırlatıcı"
      variant="create"
    />
  );
}
