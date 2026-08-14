import type { Href } from 'expo-router';

export const routes = {
  home: '/home',
  calendar: '/calendar',
  createReminder: '/create-reminder',
  history: '/history',
  settings: '/settings',
  splash: '/splash',
  welcome: '/welcome',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  register: '/register',
  verifyPhone: '/verify-phone' as Href,
  profile: '/profile',
  preferences: '/preferences',
  quietHours: '/quiet-hours',
  devices: '/devices',
  privacy: '/privacy',
  componentGallery: '/component-gallery',
  reminderDetails: (reminderId: string): Href =>
    `/reminders/${encodeURIComponent(reminderId)}` as Href,
  reminderEdit: (reminderId: string): Href =>
    `/reminders/${encodeURIComponent(reminderId)}/edit` as Href,
} as const;
