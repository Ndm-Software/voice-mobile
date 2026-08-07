import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppModal, Button, Card, NavigationRow, Screen } from '@/components';
import { useSession } from '@/application/session';
import { routes } from '@/config/routes';
import { type AppTheme, useTheme } from '@/core/theme';

const items = [
  {
    label: 'Profil',
    description: 'Kişisel bilgiler ve hesap işlemleri',
    icon: 'person' as const,
    route: routes.profile,
  },
  {
    label: 'Dil ve tercihler',
    description: 'Dil, timezone ve varsayılan süreler',
    icon: 'language' as const,
    route: routes.preferences,
  },
  {
    label: 'Sessiz saatler',
    description: 'Gün bazlı rahatsız edilmeme aralıkları',
    icon: 'clock' as const,
    route: routes.quietHours,
  },
  {
    label: 'Cihaz ve bildirimler',
    description: 'İzinler, bağlı cihazlar ve push durumu',
    icon: 'device' as const,
    route: routes.devices,
  },
  {
    label: 'Gizlilik ve yasal',
    description: 'Politikalar, veri ve hesap silme',
    icon: 'shield' as const,
    route: routes.privacy,
  },
];

export function SettingsScreen() {
  const router = useRouter();
  const { logout, session } = useSession();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <Screen description="Hesap, asistan ve cihaz tercihlerini yönet." title="Ayarlar">
      <Card style={styles.list} variant="outlined">
        {items.map((item) => (
          <NavigationRow
            description={item.description}
            icon={item.icon}
            key={item.label}
            label={item.label}
            onPress={() => router.push(item.route)}
          />
        ))}
      </Card>
      <Card
        description={session ? 'Hesabın bu cihazda açık.' : 'Oturum bilgisi bulunmuyor.'}
        style={styles.sessionCard}
        title="Oturum"
        variant="soft"
      >
        <Button
          fullWidth
          label="Çıkış yap"
          onPress={() => setLogoutVisible(true)}
          variant="destructive"
        />
      </Card>
      <AppModal onClose={() => setLogoutVisible(false)} title="Çıkış yap" visible={logoutVisible}>
        <Card description="Bu cihazdaki oturumun kapatılacak." title="Emin misin?" variant="soft">
          <Button
            fullWidth
            label="Çıkış yap"
            onPress={() => {
              setLogoutVisible(false);
              void logout();
            }}
            variant="destructive"
          />
        </Card>
      </AppModal>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    list: {
      overflow: 'hidden',
      padding: theme.spacing.none,
    },
    sessionCard: {
      marginTop: theme.spacing.lg,
    },
  });
}
