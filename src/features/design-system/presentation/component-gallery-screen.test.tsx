import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render-with-providers';

import { ComponentGalleryScreen } from './component-gallery-screen';

describe('ComponentGalleryScreen', () => {
  it('ortak bileşen gruplarını gösterir ve chip seçimini değiştirir', async () => {
    await renderWithProviders(<ComponentGalleryScreen />);

    expect(screen.getByRole('header', { name: 'Component galerisi' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Butonlar' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Input ve arama' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Push' }));
    expect(screen.getByRole('button', { name: 'Push' })).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true }),
    );
  });

  it('modal ve toast örneklerini etkileşimli çalıştırır', async () => {
    await renderWithProviders(<ComponentGalleryScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Modalı aç' }));
    expect(screen.getByRole('header', { name: 'Hatırlatıcıyı kaydet' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Modalı kapat' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Toast göster' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Hatırlatıcı başarıyla kaydedildi.');
  });
});
