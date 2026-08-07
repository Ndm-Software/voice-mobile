export interface Session {
  readonly userId: string;
  readonly phoneNumber?: string;
  readonly phoneVerified?: boolean;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessTokenExpiresAt: string;
  readonly refreshTokenExpiresAt: string;
}

export function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.userId === 'string' &&
    (candidate.phoneNumber === undefined || typeof candidate.phoneNumber === 'string') &&
    (candidate.phoneVerified === undefined || typeof candidate.phoneVerified === 'boolean') &&
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.accessTokenExpiresAt === 'string' &&
    typeof candidate.refreshTokenExpiresAt === 'string' &&
    Number.isFinite(Date.parse(candidate.accessTokenExpiresAt)) &&
    Number.isFinite(Date.parse(candidate.refreshTokenExpiresAt))
  );
}

export function isRefreshTokenUsable(session: Session, now = new Date()): boolean {
  return Date.parse(session.refreshTokenExpiresAt) > now.getTime();
}

export function isAccessTokenUsable(session: Session, now = new Date()): boolean {
  return Date.parse(session.accessTokenExpiresAt) > now.getTime();
}
