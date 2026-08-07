import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/core/theme';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(
    <ThemeProvider>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
    options,
  );
}
