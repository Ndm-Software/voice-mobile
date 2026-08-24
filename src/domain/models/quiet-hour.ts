export const quietHourDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type QuietHourDay = (typeof quietHourDays)[number];

export interface QuietHour {
  readonly id: string;
  readonly userId: string;
  readonly dayOfWeek: QuietHourDay;
  readonly start: string;
  readonly end: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SaveQuietHourInput {
  readonly id?: string;
  readonly dayOfWeek: QuietHourDay;
  readonly start: string;
  readonly end: string;
}
