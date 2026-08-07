import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppTheme, useTheme } from '@/core/theme';

import { AppIcon, type AppIconName } from './app-icon';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  readonly durationMs?: number;
  readonly variant?: ToastVariant;
}

interface ToastContextValue {
  showToast(message: string, options?: ToastOptions): void;
}

interface ToastState {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [toast, setToast] = useState<ToastState>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    nextId.current += 1;
    const id = nextId.current;
    setToast({ id, message, variant: options.variant ?? 'info' });
    timeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? undefined : current));
    }, options.durationMs ?? 3000);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <SafeAreaView pointerEvents="none" style={styles.portal}>
          <View
            accessible
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.toast, styles[`${toast.variant}Toast`]]}
          >
            <AppIcon
              color={getToastColor(theme, toast.variant)}
              name={getToastIcon(toast.variant)}
              size={theme.sizes.icon.md}
            />
            <Text style={[styles.message, { color: getToastColor(theme, toast.variant) }]}>
              {toast.message}
            </Text>
          </View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast, ToastProvider içinde kullanılmalıdır.');
  }

  return context;
}

function getToastIcon(variant: ToastVariant): AppIconName {
  if (variant === 'error' || variant === 'warning') {
    return 'warning';
  }

  return variant === 'success' ? 'sparkles' : 'bell';
}

function getToastColor(theme: AppTheme, variant: ToastVariant) {
  if (variant === 'error') return theme.colors.danger;
  if (variant === 'warning') return theme.colors.warning;
  if (variant === 'success') return theme.colors.success;
  return theme.colors.primary;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    portal: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    toast: {
      width: '100%',
      maxWidth: theme.sizes.contentMaxWidth,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      ...theme.shadows.floating,
    },
    infoToast: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    successToast: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.successSoft,
    },
    warningToast: {
      borderColor: theme.colors.warning,
      backgroundColor: theme.colors.warningSoft,
    },
    errorToast: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerSoft,
    },
    message: {
      flex: 1,
      ...theme.typography.bodySmall,
      fontWeight: theme.typography.label.fontWeight,
    },
  });
}
