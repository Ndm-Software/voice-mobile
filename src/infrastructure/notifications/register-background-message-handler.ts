import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

setBackgroundMessageHandler(getMessaging(), async () => {
  // Notification payloads arka planda Firebase tarafından sistem tepsisine teslim edilir.
});
