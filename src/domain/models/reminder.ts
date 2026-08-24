export type ReminderRepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type ReminderStatus = 'active' | 'completed' | 'past' | 'cancelled';

export interface PushNotificationSetting {
  readonly id: string;
  readonly minutesBefore: number;
  readonly enabled: boolean;
}

export interface VoiceCallSetting {
  readonly id: string;
  readonly minutesBefore: number;
  readonly retryCount: number;
  readonly enabled: boolean;
  readonly locale: string;
}

export interface Reminder {
  readonly id: string;
  readonly userId: string;
  readonly parentReminderId?: string;
  readonly title: string;
  readonly description?: string;
  readonly eventDateTime: string;
  readonly repeatType: ReminderRepeatType;
  readonly repeatUntil?: string;
  readonly status: ReminderStatus;
  readonly urgent: boolean;
  readonly pushSettings: readonly PushNotificationSetting[];
  readonly voiceCallSetting?: VoiceCallSetting;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ReminderHistoryType = 'push' | 'voice-call';
export type ReminderHistoryStatus =
  'pending' | 'success' | 'sent' | 'delivered' | 'answered' | 'missed' | 'failed';

export interface ReminderHistory {
  readonly id: string;
  readonly reminderId: string;
  readonly type: ReminderHistoryType;
  readonly status: ReminderHistoryStatus;
  readonly provider?: string;
  readonly sentAt?: string;
  readonly attempt: number;
  readonly userMessage?: string;
}
