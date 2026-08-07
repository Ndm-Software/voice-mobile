import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppModal,
  Badge,
  Button,
  Card,
  Chip,
  Screen,
  SearchField,
  StateView,
  SwitchRow,
  TextField,
  useToast,
} from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';

export function ComponentGalleryScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showToast } = useToast();
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedChip, setSelectedChip] = useState('Tümü');

  return (
    <Screen
      description="Voia'nın erişilebilir ve temalı ortak mobil bileşenleri."
      title="Component galerisi"
    >
      <Section title="Butonlar">
        <Button fullWidth icon="sparkles" label="Primary buton" onPress={() => undefined} />
        <Button fullWidth label="Secondary buton" onPress={() => undefined} variant="secondary" />
        <Button fullWidth label="Ghost buton" onPress={() => undefined} variant="ghost" />
        <Button fullWidth label="Yıkıcı işlem" onPress={() => undefined} variant="destructive" />
        <Button disabled fullWidth label="Devre dışı" onPress={() => undefined} />
      </Section>

      <Section title="Input ve arama">
        <TextField
          helperText="Bu alan yalnızca görsel ve erişilebilirlik örneğidir."
          label="Hatırlatıcı başlığı"
          placeholder="Örn. Doktor kontrolü"
        />
        <TextField
          error="Geçerli bir e-posta adresi girin."
          keyboardType="email-address"
          label="E-posta"
          placeholder="isim@example.com"
        />
        <SearchField placeholder="Hatırlatıcılarda ara" />
      </Section>

      <Section title="Badge ve chip">
        <View style={styles.wrapRow}>
          <Badge label="Nötr" />
          <Badge label="Aktif" variant="accent" />
          <Badge label="İletildi" variant="success" />
          <Badge label="Bekliyor" variant="warning" />
          <Badge label="Cevapsız" variant="danger" />
        </View>
        <View style={styles.wrapRow}>
          {['Tümü', 'Push', 'Sesli arama'].map((label) => (
            <Chip
              key={label}
              label={label}
              onPress={() => setSelectedChip(label)}
              selected={selectedChip === label}
            />
          ))}
        </View>
      </Section>

      <Section title="Kart ve switch">
        <Card
          description="Bugün 14:30 • Sesli bildirim açık"
          title="Doktor randevusu"
          variant="elevated"
        >
          <Badge label="Yaklaşıyor" variant="success" />
        </Card>
        <Card variant="outlined">
          <SwitchRow
            description="Push ve sesli arama hatırlatmalarını etkinleştirir."
            label="Bildirimler"
            onValueChange={setNotificationsEnabled}
            value={notificationsEnabled}
          />
        </Card>
      </Section>

      <Section title="Modal ve toast">
        <Button
          fullWidth
          label="Modalı aç"
          onPress={() => setModalVisible(true)}
          variant="secondary"
        />
        <Button
          fullWidth
          label="Toast göster"
          onPress={() => showToast('Hatırlatıcı başarıyla kaydedildi.', { variant: 'success' })}
        />
      </Section>

      <Section title="Ekran durumları">
        <Card variant="soft">
          <StateView
            actionLabel="Örnek aksiyon"
            onAction={() => showToast('Durum aksiyonu çalıştı.')}
            variant="empty"
          />
        </Card>
      </Section>

      <AppModal
        onClose={() => setModalVisible(false)}
        title="Hatırlatıcıyı kaydet"
        visible={modalVisible}
      >
        <Text style={styles.modalCopy}>
          Modal altyapısı, Android geri tuşu ve erişilebilir modal davranışıyla hazır.
        </Text>
        <View style={styles.modalActions}>
          <Button
            fullWidth
            label="Kapat"
            onPress={() => setModalVisible(false)}
            variant="secondary"
          />
        </View>
      </AppModal>
    </Screen>
  );
}

function Section({
  children,
  title,
}: {
  readonly children: React.ReactNode;
  readonly title: string;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    section: {
      marginBottom: theme.spacing['3xl'],
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.sectionTitle,
    },
    sectionContent: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    wrapRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    modalCopy: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    modalActions: {
      marginTop: theme.spacing['2xl'],
    },
  });
}
