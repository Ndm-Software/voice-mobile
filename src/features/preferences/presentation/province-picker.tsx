import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppModal, SearchField } from '@/components';
import { type AppTheme, useTheme } from '@/core/theme';

import { TURKEY_PROVINCES } from '../domain/turkey-provinces';

interface ProvincePickerProps {
  readonly disabled?: boolean;
  readonly error?: string;
  readonly onChange: (province: string) => void;
  readonly value: string;
}

export function ProvincePicker({ disabled = false, error, onChange, value }: ProvincePickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = normalizeForSearch(query.trim());
  const filteredProvinces = useMemo(
    () =>
      normalizedQuery
        ? TURKEY_PROVINCES.filter((province) =>
            normalizeForSearch(province).includes(normalizedQuery),
          )
        : TURKEY_PROVINCES,
    [normalizedQuery],
  );

  function close() {
    setVisible(false);
    setQuery('');
  }

  return (
    <View>
      <Text style={styles.label}>Şehir</Text>
      <Pressable
        accessibilityLabel="Şehir seç"
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
          <Text style={value ? styles.value : styles.placeholder}>{value || 'Şehir seç'}</Text>
        </View>
        <AppIcon name="chevron-right" size={theme.sizes.icon.sm} />
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <AppModal onClose={close} title="Şehir seç" visible={visible}>
        <SearchField
          accessibilityLabel="Şehir ara"
          autoFocus
          onChangeText={setQuery}
          placeholder="Şehir ara..."
          value={query}
        />
        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.list}
        >
          {filteredProvinces.map((province) => {
            const selected = province === value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={province}
                onPress={() => {
                  onChange(province);
                  close();
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {province}
                </Text>
                {selected ? <Text style={styles.selectedMark}>✓</Text> : null}
              </Pressable>
            );
          })}
          {filteredProvinces.length === 0 ? (
            <Text style={styles.empty}>Aramana uygun şehir bulunamadı.</Text>
          ) : null}
        </ScrollView>
      </AppModal>
    </View>
  );
}

function normalizeForSearch(value: string): string {
  return value.toLocaleLowerCase('tr-TR');
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
    selectorError: {
      borderColor: theme.colors.danger,
    },
    selectorDisabled: {
      backgroundColor: theme.colors.surfaceMuted,
      opacity: 0.8,
    },
    selectorPressed: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    selectorCopy: {
      flex: 1,
    },
    value: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    placeholder: {
      color: theme.colors.textMuted,
      ...theme.typography.body,
    },
    error: {
      color: theme.colors.danger,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    list: {
      maxHeight: 360,
      marginTop: theme.spacing.lg,
    },
    listContent: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
    },
    option: {
      minHeight: theme.sizes.touchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
    },
    optionSelected: {
      backgroundColor: theme.colors.primarySoft,
    },
    optionPressed: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    optionLabel: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    optionLabelSelected: {
      color: theme.colors.primary,
      ...theme.typography.label,
    },
    selectedMark: {
      color: theme.colors.primary,
      ...theme.typography.label,
    },
    empty: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      paddingVertical: theme.spacing['2xl'],
      textAlign: 'center',
    },
  });
}
