export interface Language {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly voiceName?: string;
}

export interface User {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly phoneVerified: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UserSettings {
  readonly id: string;
  readonly userId: string;
  readonly languageId: string;
  readonly timezone: string;
  readonly province?: string;
  readonly notificationsEnabled: boolean;
  readonly defaultPushBeforeMinutes: number;
  readonly defaultCallBeforeMinutes: number;
  readonly silentStart?: string;
  readonly silentEnd?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MobilePlatform = 'android' | 'ios';
export type AccountDevicePlatform = MobilePlatform | 'web' | 'windows' | 'unknown';
export type NotificationPermission = 'not-determined' | 'granted' | 'denied';

export interface AccountDevice {
  readonly id: string;
  readonly platform: AccountDevicePlatform;
  readonly name: string;
  readonly lastActiveAt: string;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface Device {
  readonly id: string;
  readonly userId: string;
  readonly platform: MobilePlatform;
  readonly name?: string;
  readonly notificationPermission: NotificationPermission;
  readonly lastActiveAt: string;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface RefreshSession {
  readonly id: string;
  readonly deviceId: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly createdAt: string;
}

export type OtpPurpose = 'phone-verification' | 'password-reset';

export interface OtpVerification {
  readonly id: string;
  readonly userId: string;
  readonly phoneNumber: string;
  readonly purpose: OtpPurpose;
  readonly expiresAt: string;
  readonly verified: boolean;
  readonly createdAt: string;
}
