function channelToLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hexColor: string): number {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
    throw new Error(`Geçersiz renk değeri: ${hexColor}`);
  }

  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);

  return (
    0.2126 * channelToLuminance(red) +
    0.7152 * channelToLuminance(green) +
    0.0722 * channelToLuminance(blue)
  );
}

export function getContrastRatio(firstColor: string, secondColor: string): number {
  const first = getRelativeLuminance(firstColor);
  const second = getRelativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}
