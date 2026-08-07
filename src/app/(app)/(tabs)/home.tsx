import { appContainer } from '@/composition/app-container';
import { HomeScreen } from '@/features/home/presentation/home-screen';

export default function HomeRoute() {
  return <HomeScreen getHomeOverview={appContainer.getHomeOverview} />;
}
