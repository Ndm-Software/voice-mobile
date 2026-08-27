import {
  cleanup,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

import type { GetReminders } from '@/application/reminder';
import { renderWithProviders } from '@/test/render-with-providers';

import { CalendarScreen } from './calendar-screen';

const mockPush = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(callback, [callback]);
    },
    useRouter: () => ({ push: mockPush }),
  };
});

function createExecuteMock() {
  return jest.fn<
    ReturnType<GetReminders['execute']>,
    Parameters<GetReminders['execute']>
  >(async () => []);
}

describe('CalendarScreen', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('görünümü değiştirir ve seçili tarihle oluşturma rotası açar', async () => {
    const user = userEvent.setup();
    const initialDate = new Date(2026, 7, 25, 12);
    const execute = createExecuteMock();

    const getReminders: GetReminders = {
      execute,
    };

    await renderWithProviders(
      <CalendarScreen
        getReminders={getReminders}
        initialDate={initialDate}
        userId="user-1"
      />,
    );

    await user.press(
      screen.getByLabelText('Hafta görünümü'),
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText('Hafta görünümü').props
          .accessibilityState.selected,
      ).toBe(true);
    });

    await user.press(
      screen.getByText('Bu tarihe hatırlatıcı ekle'),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/create-reminder',
      params: {
        initialDate: '2026-08-25',
      },
    });
  });

  it('1 karakterde search parametresi göndermez', async () => {
    const user = userEvent.setup();
    const initialDate = new Date(2026, 7, 25, 12);
    const execute = createExecuteMock();

    const getReminders: GetReminders = {
      execute,
    };

    await renderWithProviders(
      <CalendarScreen
        getReminders={getReminders}
        initialDate={initialDate}
        userId="user-1"
      />,
    );

    await waitFor(() => {
      expect(execute).toHaveBeenCalled();
    });

    execute.mockClear();

    await user.type(
      screen.getByLabelText('Hatırlatıcı ara'),
      'a',
    );

    expect(
      screen.getByText('Arama için en az 2 karakter gir.'),
    ).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 400));

    for (const call of execute.mock.calls) {
      const criteria = call[1];

      if (typeof criteria === 'object') {
        expect(criteria).not.toHaveProperty('search');
        expect(criteria).not.toHaveProperty('isCompleted');
      }
    }
  });

  it('2 veya daha fazla karakterde debounce sonrası search gönderir', async () => {
    const user = userEvent.setup();
    const initialDate = new Date(2026, 7, 25, 12);
    const execute = createExecuteMock();

    const getReminders: GetReminders = {
      execute,
    };

    await renderWithProviders(
      <CalendarScreen
        getReminders={getReminders}
        initialDate={initialDate}
        userId="user-1"
      />,
    );

    await waitFor(() => {
      expect(execute).toHaveBeenCalled();
    });

    execute.mockClear();

    await user.type(
      screen.getByLabelText('Hatırlatıcı ara'),
      'to',
    );

    await waitFor(
      () => {
        expect(
          execute.mock.calls.some((call) => {
            const criteria = call[1];

            return (
              typeof criteria === 'object' &&
              criteria.search === 'to'
            );
          }),
        ).toBe(true);
      },
      {
        timeout: 1500,
      },
    );

    for (const call of execute.mock.calls) {
      const criteria = call[1];

      if (typeof criteria === 'object') {
        expect(criteria).not.toHaveProperty('isCompleted');
      }
    }
  });

  it('Önemli filtresinde urgent true gönderir', async () => {
    const user = userEvent.setup();
    const initialDate = new Date(2026, 7, 25, 12);
    const execute = createExecuteMock();

    const getReminders: GetReminders = {
      execute,
    };

    await renderWithProviders(
      <CalendarScreen
        getReminders={getReminders}
        initialDate={initialDate}
        userId="user-1"
      />,
    );

    await waitFor(() => {
      expect(execute).toHaveBeenCalled();
    });

    execute.mockClear();

    await user.press(
      screen.getByRole('button', {
        name: 'Önemli',
      }),
    );

    await waitFor(() => {
      expect(
        execute.mock.calls.some((call) => {
          const criteria = call[1];

          return (
            typeof criteria === 'object' &&
            criteria.urgent === true
          );
        }),
      ).toBe(true);
    });

    for (const call of execute.mock.calls) {
      const criteria = call[1];

      if (typeof criteria === 'object') {
        expect(criteria).not.toHaveProperty('isCompleted');
      }
    }
  });

  it('filtreleri temizleyince search ve urgent kriterlerini kaldırır', async () => {
    const user = userEvent.setup();
    const initialDate = new Date(2026, 7, 25, 12);
    const execute = createExecuteMock();

    const getReminders: GetReminders = {
      execute,
    };

    await renderWithProviders(
      <CalendarScreen
        getReminders={getReminders}
        initialDate={initialDate}
        userId="user-1"
      />,
    );

    await waitFor(() => {
      expect(execute).toHaveBeenCalled();
    });

    await user.type(
      screen.getByLabelText('Hatırlatıcı ara'),
      'toplantı',
    );

    await user.press(
      screen.getByRole('button', {
        name: 'Önemli',
      }),
    );

    await waitFor(
      () => {
        expect(
          execute.mock.calls.some((call) => {
            const criteria = call[1];

            return (
              typeof criteria === 'object' &&
              criteria.search === 'toplantı' &&
              criteria.urgent === true
            );
          }),
        ).toBe(true);
      },
      {
        timeout: 1500,
      },
    );

    execute.mockClear();

    await user.press(
      screen.getByText('Filtreleri temizle'),
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText('Hatırlatıcı ara').props.value,
      ).toBe('');
    });

    await waitFor(() => {
      const lastCall =
        execute.mock.calls[execute.mock.calls.length - 1];

      const criteria = lastCall?.[1];

      expect(typeof criteria).toBe('object');

      if (typeof criteria === 'object') {
        expect(criteria).not.toHaveProperty('search');
        expect(criteria).not.toHaveProperty('urgent');
        expect(criteria).not.toHaveProperty('isCompleted');
      }
    });
  });

  it('arama veya önemli filtresinde sonuç yoksa sonuç bulunamadı durumunu gösterir', async () => {
    const user = userEvent.setup();
    const initialDate = new Date(2026, 7, 25, 12);
    const execute = createExecuteMock();

    const getReminders: GetReminders = {
      execute,
    };

    await renderWithProviders(
      <CalendarScreen
        getReminders={getReminders}
        initialDate={initialDate}
        userId="user-1"
      />,
    );

    await waitFor(() => {
      expect(execute).toHaveBeenCalled();
    });

    await user.type(
      screen.getByLabelText('Hatırlatıcı ara'),
      'xyz',
    );

    await waitFor(
      () => {
        expect(
          screen.getByText('Sonuç bulunamadı'),
        ).toBeTruthy();
      },
      {
        timeout: 1500,
      },
    );

    expect(
      screen.getByText(
        'Arama veya filtre kriterlerine uygun bir hatırlatıcı bulunamadı.',
      ),
    ).toBeTruthy();
  });
});