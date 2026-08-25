import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { GetReminders } from '@/application/reminder';
import { renderWithProviders } from '@/test/render-with-providers';

import { CalendarScreen } from './calendar-screen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: mockPush }),
}));

describe('CalendarScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('görünümü değiştirir ve seçili tarihle oluşturma rotası açar', async () => {
    const initialDate = new Date(2026, 7, 25, 12);
    const getReminders: GetReminders = { execute: jest.fn(async () => []) };

    await renderWithProviders(
      <CalendarScreen getReminders={getReminders} initialDate={initialDate} userId="user-1" />,
    );

    fireEvent.press(screen.getByLabelText('Hafta görünümü'));
    await waitFor(() =>
      expect(screen.getByLabelText('Hafta görünümü').props.accessibilityState.selected).toBe(true),
    );

    fireEvent.press(screen.getByText('Bu tarihe hatırlatıcı ekle'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/create-reminder',
      params: { initialDate: '2026-08-25' },
    });
  });
});
