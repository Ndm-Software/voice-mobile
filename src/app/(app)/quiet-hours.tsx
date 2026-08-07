import { FeatureShellScreen } from '@/features/navigation/presentation/feature-shell-screen';

export default function QuietHoursRoute() {
  return (
    <FeatureShellScreen
      description="Rahatsız edilmeyeceğin gün ve saat aralıklarını belirle."
      icon="clock"
      title="Sessiz saatler"
    />
  );
}
