import {
  buildMonthDays,
  buildWeekDays,
  dateFromKey,
  getCalendarRange,
  moveCalendarDate,
  toDateKey,
} from './calendar';

describe('calendar helpers', () => {
  it('ayı pazartesi başlangıçlı 42 günlük bir ızgaraya dönüştürür', () => {
    const days = buildMonthDays(new Date(2026, 7, 15));

    expect(days).toHaveLength(42);
    expect(days[0].date.getDay()).toBe(1);
    expect(days.filter((day) => day.inCurrentMonth)).toHaveLength(31);
  });

  it('haftayı pazartesiden pazara üretir', () => {
    const days = buildWeekDays(new Date(2026, 7, 25));

    expect(days.map((day) => day.date.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
    ]);
  });

  it('yerel ay sınırlarını backend için UTC ISO değerlerine çevirir', () => {
    const range = getCalendarRange(new Date(2026, 7, 25), 'month');

    expect(range).toEqual({
      startDate: new Date(2026, 7, 1, 0, 0, 0, 0).toISOString(),
      endDate: new Date(2026, 7, 31, 23, 59, 59, 999).toISOString(),
    });
  });

  it('güvenli tarih anahtarını doğrular ve görünüm adımlarını taşır', () => {
    expect(toDateKey(dateFromKey('2026-08-25') as Date)).toBe('2026-08-25');
    expect(dateFromKey('2026-02-31')).toBeUndefined();
    expect(toDateKey(moveCalendarDate(new Date(2026, 7, 25), 'week', 1))).toBe('2026-09-01');
  });
});
