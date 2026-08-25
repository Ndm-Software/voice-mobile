import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { GetHomeOverview } from '@/application/use-cases/get-home-overview';
import type { GetReminders } from '@/application/reminder';
import { ThemeProvider } from '@/core/theme';

import { HomeScreen } from './home-screen';

function renderHomeScreen(getHomeOverview: GetHomeOverview) {
  return render(
    <ThemeProvider>
      <HomeScreen getHomeOverview={getHomeOverview} />
    </ThemeProvider>,
  );
}

function renderHomeWithReminders(getHomeOverview: GetHomeOverview, getReminders: GetReminders) {
  return render(
    <ThemeProvider>
      <HomeScreen getHomeOverview={getHomeOverview} getReminders={getReminders} />
    </ThemeProvider>,
  );
}

describe('HomeScreen', () => {
  it('shows data returned by the injected repository flow', async () => {
    const getHomeOverview: GetHomeOverview = {
      execute: jest.fn().mockResolvedValue({
        applicationName: 'Voia',
        assistantTagline: 'Kişisel asistanın, yanında.',
        readiness: 'ready',
        dataSource: 'mock',
        mockDataSummary: {
          userDisplayName: 'Uğur Yılmaz',
          activeReminderCount: 2,
          deviceCount: 1,
          historyCount: 2,
        },
      }),
    };

    await renderHomeScreen(getHomeOverview);

    expect(await screen.findByText('Merhaba, Uğur Yılmaz!')).toBeTruthy();
    expect(screen.getByText('İşte bugün için planladıkların ve asistanının notları.')).toBeTruthy();
    expect(screen.getByText('GEÇMİŞ KAYITLARI')).toBeTruthy();
    expect(screen.getByText('SESSİZ SAATLER')).toBeTruthy();
    expect(getHomeOverview.execute).toHaveBeenCalledTimes(1);
  });

  it('allows a failed request to be retried', async () => {
    const getHomeOverview: GetHomeOverview = {
      execute: jest.fn().mockRejectedValueOnce(new Error('Geçici hata')).mockResolvedValueOnce({
        applicationName: 'Voia',
        assistantTagline: 'Kişisel asistanın, yanında.',
        readiness: 'ready',
        dataSource: 'mock',
      }),
    };

    await renderHomeScreen(getHomeOverview);

    await fireEvent.press(await screen.findByRole('button', { name: 'Yeniden dene' }));

    await waitFor(() => expect(getHomeOverview.execute).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Merhaba!')).toBeTruthy();
  });

  it('shows active reminders with notification and voice badges', async () => {
    const getHomeOverview: GetHomeOverview = {
      execute: jest.fn().mockResolvedValue({
        applicationName: 'Voia',
        assistantTagline: 'Kişisel asistanın, yanında.',
        readiness: 'ready',
        dataSource: 'mock',
      }),
    };
    const getReminders: GetReminders = {
      execute: jest.fn().mockResolvedValue([
        {
          id: '6001',
          userId: '1001',
          title: 'Doktor kontrolü',
          description: 'Kontrol sonuçlarını yanında götür.',
          eventDateTime: '2026-08-11T09:30:00+03:00',
          repeatType: 'none',
          status: 'active',
          urgent: false,
          pushSettings: [{ id: '7001', minutesBefore: 15, enabled: true }],
          voiceCallSetting: {
            id: '8001',
            minutesBefore: 10,
            retryCount: 1,
            enabled: true,
            locale: 'tr-TR',
          },
          createdAt: '2026-08-01T12:00:00+03:00',
          updatedAt: '2026-08-01T12:00:00+03:00',
        },
      ]),
    };

    await renderHomeWithReminders(getHomeOverview, getReminders);

    expect(await screen.findByText('Yaklaşan Hatırlatıcılar')).toBeTruthy();
    expect(screen.getByText('Doktor kontrolü')).toBeTruthy();
    expect(screen.getByText('Bildirim')).toBeTruthy();
    expect(screen.getByText('Arama')).toBeTruthy();
    expect(getReminders.execute).toHaveBeenCalledWith(undefined, 'active', expect.any(AbortSignal));
  });
});
