import { routes } from './routes';

describe('uygulama rotaları', () => {
  it('bütün ekran kabukları için benzersiz URL tanımlar', () => {
    const paths = Object.values(routes).filter((route) => typeof route === 'string') as string[];

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/home',
        '/calendar',
        '/create-reminder',
        '/history',
        '/settings',
        '/welcome',
        '/forgot-password',
        '/reset-password',
        '/verify-phone',
        '/component-gallery',
      ]),
    );
    expect(routes.reminderDetails('reminder 1')).toBe('/reminders/reminder%201');
    expect(routes.reminderEdit('reminder 1')).toBe('/reminders/reminder%201/edit');
  });
});
