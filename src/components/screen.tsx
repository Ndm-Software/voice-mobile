import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppTheme, useTheme } from '@/core/theme';

interface ScreenProps extends PropsWithChildren, Omit<ScrollViewProps, 'contentContainerStyle'> {
  readonly description?: string;
  readonly headerAction?: ReactNode;
  readonly title: string;
}

export function Screen({
  children,
  description,
  headerAction,
  title,
  ...scrollProps
}: ScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
          {headerAction}
        </View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing['5xl'],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      color: theme.colors.primary,
      ...theme.typography.pageTitle,
    },
    description: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    body: {
      marginTop: theme.spacing['2xl'],
    },
  });
}
