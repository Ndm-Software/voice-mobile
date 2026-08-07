import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { GetHomeOverview } from '@/application/use-cases/get-home-overview';
import { ThemeProvider } from '@/core/theme';

import { HomeScreen } from './home-screen';

function renderHomeScreen(getHomeOverview: GetHomeOverview) {
  return render(
    <ThemeProvider>
      <HomeScreen getHomeOverview={getHomeOverview} />
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

    expect(await screen.findByText('Merhaba, Uğur Yılmaz')).toBeTruthy();
    expect(screen.getByText('Hatırlatmaların ve kişisel ayarların senin için hazır.')).toBeTruthy();
    expect(
      screen.getByText('Uğur Yılmaz • 2 aktif hatırlatıcı • 1 cihaz • 2 geçmiş kaydı'),
    ).toBeTruthy();
    expect(screen.getByText('Gününü planlamaya başla')).toBeTruthy();
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
    expect(await screen.findByText('Hoş geldin')).toBeTruthy();
  });
});
