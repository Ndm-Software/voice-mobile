import { DeviceNotificationScreen } from '@/features/notifications';
import { appContainer } from '@/composition/app-container';

export default function DevicesRoute() {
  return <DeviceNotificationScreen deviceSessionManager={appContainer.deviceSessionManager} />;
}
