import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { type AppTheme, useTheme } from '@/core/theme';

import { AppIcon, type AppIconName } from './app-icon';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  readonly error?: string;
  readonly helperText?: string;
  readonly label?: string;
  readonly leadingIcon?: AppIconName;
  readonly onTrailingPress?: () => void;
  readonly trailingAccessibilityLabel?: string;
  readonly trailingIcon?: AppIconName;
}

export function TextField({
  accessibilityLabel,
  editable = true,
  error,
  helperText,
  label,
  leadingIcon,
  onBlur,
  onFocus,
  onTrailingPress,
  trailingAccessibilityLabel,
  trailingIcon,
  ...inputProps
}: TextFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);
  const supportText = error ?? helperText;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {leadingIcon ? <AppIcon name={leadingIcon} size={theme.sizes.icon.md} /> : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accentStrong}
          style={styles.input}
        />
        {trailingIcon && onTrailingPress ? (
          <Pressable
            accessibilityLabel={trailingAccessibilityLabel}
            accessibilityRole="button"
            hitSlop={theme.spacing.sm}
            onPress={onTrailingPress}
            style={styles.trailingButton}
          >
            <AppIcon name={trailingIcon} size={theme.sizes.icon.md} />
          </Pressable>
        ) : trailingIcon ? (
          <AppIcon name={trailingIcon} size={theme.sizes.icon.md} />
        ) : null}
      </View>
      {supportText ? (
        <Text accessibilityLiveRegion="polite" style={[styles.support, error && styles.error]}>
          {supportText}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    wrapper: {
      alignSelf: 'stretch',
    },
    label: {
      color: theme.colors.textPrimary,
      ...theme.typography.label,
      marginBottom: theme.spacing.sm,
    },
    inputContainer: {
      minHeight: theme.sizes.inputHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    inputFocused: {
      borderWidth: 2,
      borderColor: theme.colors.accentStrong,
      paddingHorizontal: theme.spacing.lg - 1,
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    inputDisabled: {
      backgroundColor: theme.colors.surfaceMuted,
      opacity: 0.8,
    },
    input: {
      flex: 1,
      minWidth: 0,
      paddingVertical: theme.spacing.md,
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    trailingButton: {
      width: theme.sizes.touchTarget,
      height: theme.sizes.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -theme.spacing.md,
    },
    support: {
      color: theme.colors.textMuted,
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    error: {
      color: theme.colors.danger,
    },
  });
}
