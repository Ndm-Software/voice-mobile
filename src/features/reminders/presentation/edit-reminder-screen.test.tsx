import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { UpdateReminder } from '@/application/reminder';
import { ToastProvider } from '@/components';
import { ThemeProvider } from '@/core/theme';
import type { Reminder } from '@/domain/models/reminder';

import { EditReminderScreen } from './edit-reminder-screen';

const reminder: Reminder = {
  id: 'reminder-id',
  userId: 'user-id',
  title: 'Doktor kontrolü',
  description: 'Eski açıklama',
  eventDateTime: '2099-08-20T09:30:00.000Z',
  repeatType: 'none',
  status: 'active',
  urgent: false,
  pushSettings: [{ id: 'push-id', minutesBefore: 15, enabled: true }],
  createdAt: '2026-08-27T07:00:00.000Z',
  updatedAt: '2026-08-27T07:00:00.000Z',
};

function renderScreen(updateReminder: UpdateReminder) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <EditReminderScreen reminder={reminder} updateReminder={updateReminder} />
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('EditReminderScreen', () => {
  it('değiştirilen temel bilgileri mevcut reminder kimliğiyle kaydeder', async () => {
    const updateReminder: UpdateReminder = {
      execute: jest.fn().mockResolvedValue({
        ...reminder,
        title: 'Güncellenmiş doktor kontrolü',
        description: 'Sonuçları yanında götür',
      }),
    };

    await renderScreen(updateReminder);

    await fireEvent.changeText(screen.getByLabelText('Başlık'), 'Güncellenmiş doktor kontrolü');
    await fireEvent.changeText(screen.getByLabelText('Açıklama'), 'Sonuçları yanında götür');
    await fireEvent.press(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));

    await waitFor(() =>
      expect(updateReminder.execute).toHaveBeenCalledWith({
        id: 'reminder-id',
        userId: 'user-id',
        title: 'Güncellenmiş doktor kontrolü',
        description: 'Sonuçları yanında götür',
        eventDateTime: '2099-08-20T09:30:00.000Z',
        urgent: false,
      }),
    );
  });

  it('başlık boşsa backend çağrısı yapmaz', async () => {
    const updateReminder: UpdateReminder = { execute: jest.fn() };

    await renderScreen(updateReminder);

    await fireEvent.changeText(screen.getByLabelText('Başlık'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));

    expect(await screen.findByText('Başlık zorunludur.')).toBeTruthy();
    expect(updateReminder.execute).not.toHaveBeenCalled();
  });
});
