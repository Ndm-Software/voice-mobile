import { formatTimezoneOffset, getSupportedTimezones, isValidTimezone } from './timezones';

describe('timezones', () => {
  it('geçerli IANA saat dilimlerini ayırt eder', () => {
    expect(isValidTimezone('Europe/Istanbul')).toBe(true);
    expect(isValidTimezone('uydurma/saat-dilimi')).toBe(false);
  });

  it('tercih edilen geçerli değerleri listeye ekleyip tekrarları kaldırır', () => {
    const values = getSupportedTimezones('Europe/Istanbul', 'Europe/Istanbul', 'gecersiz');

    expect(values).toContain('Europe/Istanbul');
    expect(values).not.toContain('gecersiz');
    expect(new Set(values).size).toBe(values.length);
  });

  it('saat diliminin UTC farkını kullanıcıya gösterilecek biçimde üretir', () => {
    expect(formatTimezoneOffset('Europe/Istanbul', new Date('2026-01-15T12:00:00Z'))).toMatch(
      /GMT\+03:00|UTC\+03:00/,
    );
  });
});
