import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render-with-providers';

import { TURKEY_PROVINCES } from '../domain/turkey-provinces';
import { ProvincePicker } from './province-picker';

describe('ProvincePicker', () => {
  it('81 benzersiz ili içerir', () => {
    expect(TURKEY_PROVINCES).toHaveLength(81);
    expect(new Set(TURKEY_PROVINCES).size).toBe(81);
  });

  it('şehirleri Türkçe karakterlere göre aratır ve seçimi bildirir', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<ProvincePicker onChange={onChange} value="" />);

    await fireEvent.press(screen.getByRole('button', { name: 'Şehir seç' }));
    await fireEvent.changeText(screen.getByLabelText('Şehir ara'), 'ığd');
    await fireEvent.press(screen.getByRole('button', { name: 'Iğdır' }));

    expect(onChange).toHaveBeenCalledWith('Iğdır');
    expect(screen.queryByLabelText('Şehir ara')).toBeNull();
  });
});
