const fallbackTimezones = [
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Baghdad',
  'Asia/Baku',
  'Asia/Beirut',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tbilisi',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Sofia',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Pacific/Auckland',
  'Pacific/Honolulu',
] as const;

interface IntlWithSupportedValues {
  supportedValuesOf?: (key: 'timeZone') => string[];
}

export function getSupportedTimezones(...preferred: readonly string[]): readonly string[] {
  const supportedValuesOf = (Intl as typeof Intl & IntlWithSupportedValues).supportedValuesOf;
  const runtimeValues = supportedValuesOf?.('timeZone') ?? [...fallbackTimezones];
  return [...new Set([...preferred.filter(isValidTimezone), ...runtimeValues])].sort(
    (left, right) => left.localeCompare(right, 'en'),
  );
}

export function isValidTimezone(value: string): boolean {
  if (!value.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function formatTimezoneOffset(timezone: string, date = new Date()): string {
  try {
    const offset = new Intl.DateTimeFormat('tr-TR', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;
    return offset ?? 'UTC';
  } catch {
    return 'UTC';
  }
}
