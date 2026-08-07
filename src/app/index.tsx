import { Redirect } from 'expo-router';

import { routes } from '@/config/routes';

export default function IndexRoute() {
  return <Redirect href={routes.splash} />;
}
