import { appContainer } from '@/composition/app-container';
import { useSession } from '@/application/session';
import { HomeScreen } from '@/features/home/presentation/home-screen';

export default function HomeRoute() {
  const { session } = useSession();

  return (
    <HomeScreen
      getHomeOverview={appContainer.getHomeOverview}
      getReminders={appContainer.getReminders}
      userId={session?.userId}
    />
  );
}
