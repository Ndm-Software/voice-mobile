import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppModal, Button, SearchField } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';

import { formatTimezoneOffset, getSupportedTimezones } from '../domain/timezones';

interface TimezonePickerProps {
  readonly deviceTimezone: string;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly onChange: (timezone: string) => void;
  readonly value: string;
}

export function TimezonePicker({
  deviceTimezone,
  disabled = false,
  error,
  onChange,
  value,
}: TimezonePickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const timezones = useMemo(
    () => getSupportedTimezones(value, deviceTimezone),
    [deviceTimezone, value],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
  const filteredTimezones = useMemo(
    () =>
      normalizedQuery
        ? timezones.filter((timezone) =>
            `${timezone} ${formatTimezoneOffset(timezone)}`
              .toLocaleLowerCase('tr-TR')
              .includes(normalizedQuery),
          )
        : timezones,
    [normalizedQuery, timezones],
  );

  function close() {
    setVisible(false);
    setQuery('');
  }

  function select(timezone: string) {
    onChange(timezone);
    close();
  }

  return (
    <View>
      <Text style={styles.label}>Saat dilimi</Text>
      <Pressable
        accessibilityLabel="Saat dilimi seç"
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: visible }}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.selector,
          error && styles.selectorError,
          disabled && styles.selectorDisabled,
          pressed && !disabled && styles.selectorPressed,
        ]}
      >
        <View style={styles.selectorCopy}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.offset}>{formatTimezoneOffset(value)}</Text>
        </View>
        <AppIcon name="chevron-right" size={theme.sizes.icon.sm} />
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <AppModal onClose={close} title="Saat dilimi seç" visible={visible}>
        <Button
          disabled={value === deviceTimezone}
          fullWidth
          icon="device"
          label={`Cihaz saat dilimini kullan (${deviceTimezone})`}
          onPress={() => select(deviceTimezone)}
          variant="secondary"
        />
        <View style={styles.search}>
          <SearchField
            accessibilityLabel="Saat dilimi ara"
            autoFocus
            onChangeText={setQuery}
            placeholder="Şehir veya saat dilimi ara..."
            value={query}
          />
        </View>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredTimezones}
          initialNumToRender={12}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(timezone) => timezone}
          ListEmptyComponent={
            <Text style={styles.empty}>Aramana uygun saat dilimi bulunamadı.</Text>
          }
          maxToRenderPerBatch={16}
          renderItem={({ item: timezone }) => {
            const selected = timezone === value;
            return (
              <Pressable
                accessibilityLabel={timezone}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => select(timezone)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {timezone}
                  </Text>
                  <Text style={styles.optionOffset}>{formatTimezoneOffset(timezone)}</Text>
                </View>
                {selected ? <Text style={styles.selectedMark}>✓</Text> : null}
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          windowSize={7}
        />
      </AppModal>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    label: {
      color: theme.colors.textPrimary,
      ...theme.typography.label,
      marginBottom: theme.spacing.sm,
    },
    selector: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    selectorError: { borderColor: theme.colors.danger },
    selectorDisabled: { backgroundColor: theme.colors.surfaceMuted, opacity: 0.8 },
    selectorPressed: { backgroundColor: theme.colors.surfaceSoft },
    selectorCopy: { flex: 1 },
    value: { color: theme.colors.textPrimary, ...theme.typography.body },
    offset: { color: theme.colors.textSecondary, ...theme.typography.caption, marginTop: 2 },
    error: { color: theme.colors.danger, ...theme.typography.caption, marginTop: theme.spacing.xs },
    search: { marginTop: theme.spacing.lg },
    list: { maxHeight: 360, marginTop: theme.spacing.md },
    listContent: { gap: theme.spacing.xs, paddingBottom: theme.spacing.md },
    option: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    optionSelected: { backgroundColor: theme.colors.primarySoft },
    optionPressed: { backgroundColor: theme.colors.surfaceSoft },
    optionCopy: { flex: 1 },
    optionLabel: { color: theme.colors.textPrimary, ...theme.typography.body },
    optionLabelSelected: { color: theme.colors.primary, ...theme.typography.label },
    optionOffset: { color: theme.colors.textSecondary, ...theme.typography.caption, marginTop: 2 },
    selectedMark: { color: theme.colors.primary, ...theme.typography.label },
    empty: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      paddingVertical: theme.spacing['2xl'],
      textAlign: 'center',
    },
  });
}
