import { act, screen, waitFor } from '@testing-library/react-native';
import type { EffectCallback } from 'react';

import type { GetReminderHistory } from '@/application/history';
import { renderWithProviders } from '@/test/render-with-providers';

import { HistoryScreen } from './history-screen';

const mockPush = jest.fn();
let mockFocusEffect: EffectCallback | undefined;

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: EffectCallback) => {
    const React = jest.requireActual<typeof import('react')>('react');
    mockFocusEffect = effect;
    React.useEffect(effect, [effect]);
  },
  useRouter: () => ({ push: mockPush }),
}));

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusEffect = undefined;
  });

  it('ekran yeniden odaklandığında geçmiş listesini yeniler', async () => {
    const getReminderHistory: GetReminderHistory = {
      execute: jest.fn(async () => [
        {
          id: 'history-1',
          reminderId: 'reminder-1',
          type: 'push' as const,
          status: 'success' as const,
          sentAt: '2026-08-24T06:00:00.000Z',
          attempt: 1,
        },
      ]),
    };

    await renderWithProviders(<HistoryScreen getReminderHistory={getReminderHistory} />);

    expect(await screen.findByText('Push bildirimi')).toBeTruthy();
    expect(getReminderHistory.execute).toHaveBeenCalledTimes(1);

    await act(async () => {
      await mockFocusEffect?.();
    });

    await waitFor(() => expect(getReminderHistory.execute).toHaveBeenCalledTimes(2));
  });
});
