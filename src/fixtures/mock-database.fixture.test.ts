import { createMockDatabaseFixture } from './mock-database.fixture';

describe('createMockDatabaseFixture', () => {
  it('ER diyagramındaki güvenli mobil varlıkları ilişkili şekilde üretir', () => {
    const fixture = createMockDatabaseFixture();

    expect(fixture.languages).toEqual([
      { id: '1', code: 'tr', name: 'Türkçe', voiceName: 'Burcu' },
      { id: '2', code: 'en', name: 'English', voiceName: 'Joanna' },
    ]);
    expect(fixture.users).toHaveLength(1);
    expect(fixture.userSettings[0]?.userId).toBe(fixture.users[0]?.id);
    expect(fixture.devices[0]?.userId).toBe(fixture.users[0]?.id);
    expect(fixture.reminders).toHaveLength(3);
    expect(fixture.reminders[0]?.pushSettings).toHaveLength(1);
    expect(fixture.reminders[0]?.voiceCallSetting?.locale).toBe('tr-TR');
    expect(fixture.reminderHistory[0]?.reminderId).toBe('6003');
  });

  it('backend sırlarını ve iş kuyruğu kimliklerini içermez', () => {
    const serialized = JSON.stringify(createMockDatabaseFixture());

    expect(serialized).not.toContain('password_hash');
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('token_hash');
    expect(serialized).not.toContain('tokenHash');
    expect(serialized).not.toContain('otp_code');
    expect(serialized).not.toContain('otpCode');
    expect(serialized).not.toContain('job_id');
    expect(serialized).not.toContain('jobId');
  });
});
