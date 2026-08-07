import { getContrastRatio } from './contrast';
import { lightTheme } from './theme';

describe('Voia light theme', () => {
  it.each([
    ['ana metin / zemin', lightTheme.colors.textPrimary, lightTheme.colors.background],
    ['ikincil metin / zemin', lightTheme.colors.textSecondary, lightTheme.colors.background],
    ['soluk metin / yüzey', lightTheme.colors.textMuted, lightTheme.colors.surface],
    ['buton metni / primary', lightTheme.colors.textOnPrimary, lightTheme.colors.primary],
    ['success / yüzey', lightTheme.colors.success, lightTheme.colors.surface],
    ['warning / yüzey', lightTheme.colors.warning, lightTheme.colors.surface],
    ['danger / yüzey', lightTheme.colors.danger, lightTheme.colors.surface],
    ['güçlü mint / yüzey', lightTheme.colors.accentStrong, lightTheme.colors.surface],
  ])('%s normal metin için en az 4.5:1 kontrast sağlar', (_, foreground, background) => {
    expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('standart etkileşim ve form ölçülerini korur', () => {
    expect(lightTheme.sizes.touchTarget).toBeGreaterThanOrEqual(44);
    expect(lightTheme.sizes.inputHeight).toBe(52);
    expect(lightTheme.sizes.buttonHeight).toBe(52);
    expect(lightTheme.spacing.lg).toBe(16);
    expect(lightTheme.radii.lg).toBe(16);
  });

  it('hatalı renk değerlerini kontrast hesabına kabul etmez', () => {
    expect(() => getContrastRatio('#FFF', lightTheme.colors.surface)).toThrow('Geçersiz renk');
  });
});
