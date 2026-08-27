import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type {
  ChangeReminderStatus,
  DeleteReminder,
  GetReminderDetails,
} from '@/application/reminder';
import { ToastProvider } from '@/components';
import { ThemeProvider } from '@/core/theme';
import type { Reminder } from '@/domain/models/reminder';

import { ReminderDetailScreen } from './reminder-detail-screen';

const reminder: Reminder = {
  id: '6001',
  userId: '1001',
  title: 'Doktor kontrolü',
  description: 'Sonuçları götür',
  eventDateTime: '2099-08-20T09:30:00.000Z',
  repeatType: 'none',
  status: 'active',
  urgent: true,
  pushSettings: [{ id: '7001', minutesBefore: 15, enabled: true }],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
};

function renderScreen(
  getReminderDetails: GetReminderDetails,
  changeReminderStatus: ChangeReminderStatus,
  deleteReminder: DeleteReminder,
) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <ReminderDetailScreen
          changeReminderStatus={changeReminderStatus}
          deleteReminder={deleteReminder}
          getReminderDetails={getReminderDetails}
          reminderId="6001"
          userId="1001"
        />
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('ReminderDetailScreen', () => {
  it('detayı gösterir ve onay sonrasında tamamlandı durumuna geçirir', async () => {
    const getReminderDetails: GetReminderDetails = {
      execute: jest.fn().mockResolvedValue(reminder),
    };
    const changeReminderStatus: ChangeReminderStatus = {
      execute: jest.fn().mockResolvedValue({ ...reminder, status: 'completed' }),
    };
    const deleteReminder: DeleteReminder = { execute: jest.fn() };

    await renderScreen(getReminderDetails, changeReminderStatus, deleteReminder);

    expect(await screen.findByText('Doktor kontrolü')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tamamlandı olarak işaretle' }));
    expect(
      await screen.findByText('Hatırlatıcı aktif listeden geçmiş listesine taşınacak.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Onayla' }));

    await waitFor(() =>
      expect(changeReminderStatus.execute).toHaveBeenCalledWith({
        id: '6001',
        userId: '1001',
        status: 'completed',
      }),
    );
    expect(await screen.findByRole('button', { name: 'Yeniden aç' })).toBeTruthy();
  });

  it('silme işlemini kullanıcı onayı gelmeden başlatmaz', async () => {
    const getReminderDetails: GetReminderDetails = {
      execute: jest.fn().mockResolvedValue(reminder),
    };
    const changeReminderStatus: ChangeReminderStatus = { execute: jest.fn() };
    const deleteReminder: DeleteReminder = { execute: jest.fn().mockResolvedValue(undefined) };

    await renderScreen(getReminderDetails, changeReminderStatus, deleteReminder);

    await fireEvent.press(await screen.findByRole('button', { name: 'Hatırlatıcıyı sil' }));
    expect(deleteReminder.execute).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'Bu işlem geri alınamaz. Hatırlatıcı ve ona bağlı bildirim ayarları silinecek.',
      ),
    ).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Evet, sil' })).toBeTruthy();
  });
});
