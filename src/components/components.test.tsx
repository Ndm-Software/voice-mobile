import { act, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderWithProviders } from '@/test/render-with-providers';

import { AppModal } from './app-modal';
import { Button } from './button';
import { Chip } from './chip';
import { StateView } from './state-view';
import { SwitchRow } from './switch-row';
import { TextField } from './text-field';
import { useToast } from './toast';

describe('ortak bileşenler', () => {
  it('button aksiyonunu çalıştırır ve loading durumunda tekrar basılmasını engeller', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <>
        <Button label="Kaydet" onPress={onPress} />
        <Button label="Bekle" loading onPress={onPress} />
      </>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('button', { name: 'Bekle' })).toBeDisabled();
  });

  it('input değerini ve doğrulama hatasını erişilebilir biçimde gösterir', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(
      <TextField error="Bu alan zorunludur." label="Başlık" onChangeText={onChangeText} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Başlık'), 'Doktor kontrolü');

    expect(onChangeText).toHaveBeenCalledWith('Doktor kontrolü');
    expect(screen.getByText('Bu alan zorunludur.')).toBeTruthy();
  });

  it('chip seçimini ve switch değişimini bildirir', async () => {
    const onChipPress = jest.fn();
    const onValueChange = jest.fn();
    await renderWithProviders(
      <>
        <Chip label="Push" onPress={onChipPress} selected />
        <SwitchRow label="Bildirimler" onValueChange={onValueChange} value />
      </>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Push' }));
    await fireEvent(screen.getByRole('switch', { name: 'Bildirimler' }), 'valueChange', false);

    expect(onChipPress).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('modalı Android geri davranışıyla kapatır', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <AppModal onClose={onClose} title="Onay" visible>
        <Text>Modal içeriği</Text>
      </AppModal>,
    );

    await fireEvent.press(screen.getByLabelText('Modalı kapat'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('state aksiyonunu ve toast yaşam süresini çalıştırır', async () => {
    jest.useFakeTimers();
    const onAction = jest.fn();
    await renderWithProviders(
      <>
        <ToastTrigger />
        <StateView onAction={onAction} variant="offline" />
      </>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Toast göster' }));
    expect(screen.getByRole('alert')).toHaveTextContent('İşlem tamamlandı.');

    await fireEvent.press(screen.getByRole('button', { name: 'Yeniden dene' }));
    expect(onAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    jest.useRealTimers();
  });
});

function ToastTrigger() {
  const { showToast } = useToast();
  return <Button label="Toast göster" onPress={() => showToast('İşlem tamamlandı.')} />;
}
