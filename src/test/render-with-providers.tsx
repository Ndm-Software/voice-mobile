import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/core/theme';
import { PendingRegistrationProvider } from '@/application/auth';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(
    <ThemeProvider>
      <PendingRegistrationProvider>
        <ToastProvider>{ui}</ToastProvider>
      </PendingRegistrationProvider>
    </ThemeProvider>,
    options,
  );
}
