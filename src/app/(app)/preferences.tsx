import { appContainer } from '@/composition/app-container';
import { PreferencesScreen } from '@/features/preferences/presentation/preferences-screen';

export default function PreferencesRoute() {
  return (
    <PreferencesScreen
      getLanguages={appContainer.getLanguages}
      getPreferences={appContainer.getPreferences}
      updatePreferences={appContainer.updatePreferences}
    />
  );
}
