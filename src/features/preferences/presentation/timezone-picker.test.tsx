import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render-with-providers';

import { TimezonePicker } from './timezone-picker';

describe('TimezonePicker', () => {
  it('aranan IANA saat dilimini seçip modalı kapatır', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <TimezonePicker
        deviceTimezone="Europe/Istanbul"
        onChange={onChange}
        value="Europe/Istanbul"
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Saat dilimi seç' }));
    await fireEvent.changeText(screen.getByLabelText('Saat dilimi ara'), 'berlin');
    await fireEvent.press(screen.getByRole('button', { name: 'Europe/Berlin' }));

    expect(onChange).toHaveBeenCalledWith('Europe/Berlin');
    expect(screen.queryByLabelText('Saat dilimi ara')).toBeNull();
  });

  it('cihaz saat dilimini tek dokunuşla uygular', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <TimezonePicker deviceTimezone="Europe/Istanbul" onChange={onChange} value="Europe/Berlin" />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Saat dilimi seç' }));
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Cihaz saat dilimini kullan (Europe/Istanbul)',
      }),
    );

    expect(onChange).toHaveBeenCalledWith('Europe/Istanbul');
  });
});
