import type { RemoteMessage } from '@react-native-firebase/messaging';

import { mapRemoteMessage } from './firebase-push-notification-gateway';

describe('mapRemoteMessage', () => {
  it('FCM reminder payloadını güvenli mobil modele çevirir', () => {
    const message = {
      messageId: 'message-1',
      notification: { title: 'Doktor randevusu', body: '10 dakika kaldı.' },
      data: { reminderId: 'b846b6a9-84e1-4273-9eb1-ab458e20a3f6' },
      fcmOptions: {},
    } as RemoteMessage;

    expect(mapRemoteMessage(message)).toEqual({
      messageId: 'message-1',
      title: 'Doktor randevusu',
      body: '10 dakika kaldı.',
      reminderId: 'b846b6a9-84e1-4273-9eb1-ab458e20a3f6',
    });
  });
});
