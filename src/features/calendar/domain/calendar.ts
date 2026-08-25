export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarDay {
  readonly date: Date;
  readonly dateKey: string;
  readonly inCurrentMonth: boolean;
}

export interface CalendarRange {
  readonly startDate: string;
  readonly endDate: string;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return toDateKey(date) === value ? date : undefined;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function buildMonthDays(date: Date): readonly CalendarDay[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const gridStart = startOfWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return {
      date: day,
      dateKey: toDateKey(day),
      inCurrentMonth: day.getMonth() === date.getMonth(),
    };
  });
}

export function buildWeekDays(date: Date): readonly CalendarDay[] {
  const weekStart = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return { date: day, dateKey: toDateKey(day), inCurrentMonth: true };
  });
}

export function getCalendarRange(date: Date, mode: CalendarViewMode): CalendarRange {
  let start: Date;
  let end: Date;

  if (mode === 'month') {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  } else if (mode === 'week') {
    start = startOfWeek(date);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    end = new Date(start);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function moveCalendarDate(date: Date, mode: CalendarViewMode, direction: -1 | 1): Date {
  if (mode === 'month') {
    return new Date(date.getFullYear(), date.getMonth() + direction, 1, 12);
  }
  const result = new Date(date);
  result.setDate(result.getDate() + direction * (mode === 'week' ? 7 : 1));
  return result;
}
