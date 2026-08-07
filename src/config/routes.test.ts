import { routes } from './routes';

describe('uygulama rotaları', () => {
  it('bütün ekran kabukları için benzersiz URL tanımlar', () => {
    const paths = Object.values(routes);

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
  });
});
