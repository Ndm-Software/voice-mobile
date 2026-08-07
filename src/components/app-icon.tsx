import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { useTheme } from '@/core/theme';

export type AppIconName =
  | 'home'
  | 'calendar'
  | 'add'
  | 'history'
  | 'settings'
  | 'chevron-right'
  | 'search'
  | 'warning'
  | 'offline'
  | 'empty'
  | 'refresh'
  | 'palette'
  | 'person'
  | 'bell'
  | 'clock'
  | 'language'
  | 'device'
  | 'shield'
  | 'login'
  | 'eye'
  | 'eye-off'
  | 'sparkles';

const symbols = {
  home: { ios: 'house.fill', android: 'home' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  add: { ios: 'plus.circle.fill', android: 'add_circle' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  settings: { ios: 'gearshape.fill', android: 'settings' },
  'chevron-right': { ios: 'chevron.right', android: 'chevron_right' },
  search: { ios: 'magnifyingglass', android: 'search' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  offline: { ios: 'wifi.slash', android: 'wifi_off' },
  empty: { ios: 'tray', android: 'inbox' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  palette: { ios: 'paintpalette.fill', android: 'palette' },
  person: { ios: 'person.fill', android: 'person' },
  bell: { ios: 'bell.fill', android: 'notifications' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  language: { ios: 'globe', android: 'language' },
  device: { ios: 'iphone', android: 'smartphone' },
  shield: { ios: 'shield.fill', android: 'shield' },
  login: { ios: 'rectangle.portrait.and.arrow.right', android: 'login' },
  eye: { ios: 'eye.fill', android: 'visibility' },
  'eye-off': { ios: 'eye.slash.fill', android: 'visibility_off' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
} as const satisfies Record<AppIconName, SymbolViewProps['name']>;

interface AppIconProps {
  readonly color?: ColorValue;
  readonly name: AppIconName;
  readonly size?: number;
}

export function AppIcon({ color, name, size }: AppIconProps) {
  const theme = useTheme();
  const iconSize = size ?? theme.sizes.icon.md;

  return (
    <SymbolView
      fallback={
        <View style={[styles.fallback, { width: iconSize, height: iconSize }]}>
          <Text style={{ color: color ?? theme.colors.textSecondary }}>•</Text>
        </View>
      }
      name={symbols[name]}
      size={iconSize}
      tintColor={color ?? theme.colors.textSecondary}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
