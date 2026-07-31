import {
  IAM_ACCOUNTS,
  IAM_AUDIT_LOGS,
  IAM_KYC_VERIFICATIONS,
  IAM_NOTIFICATION_DELIVERY_LOGS,
  IAM_NOTIFICATION_PREFERENCES,
  IAM_NOTIFICATION_TEMPLATE,
  IAM_NOTIFICATIONS,
  IAM_PHONE_VERIFICATIONS,
  IAM_ROLES,
} from './iam-seed-data';

describe('IAM seed data', () => {
  const bannedBusinessTerms = /\b(codex|test|sample|mock|smoke|dummy|placeholder)\b/i;

  it('contains the approved deterministic account distribution', () => {
    expect(IAM_ACCOUNTS).toHaveLength(60);
    expect(
      IAM_ACCOUNTS.reduce<Record<string, number>>((counts, account) => {
        counts[account.role] = (counts[account.role] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({
      ADMIN: 1,
      MANAGER: 2,
      DOCTOR: 8,
      RECEPTIONIST: 4,
      NURSE: 5,
      PATIENT: 40,
    });
    expect(IAM_ACCOUNTS[0].accountId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(IAM_ACCOUNTS.filter(({ role }) => role === 'PATIENT').map(({ accountId }) => accountId)).toEqual(
      Array.from(
        { length: 40 },
        (_, index) => `550e8400-e29b-41d4-a716-446655440${String(index + 20).padStart(3, '0')}`,
      ),
    );
  });

  it('keeps account identities unique and notification records aligned', () => {
    expect(new Set(IAM_ACCOUNTS.map(({ accountId }) => accountId)).size).toBe(60);
    expect(new Set(IAM_ACCOUNTS.map(({ username }) => username)).size).toBe(60);
    expect(new Set(IAM_ACCOUNTS.map(({ email }) => email)).size).toBe(60);
    expect(IAM_NOTIFICATIONS).toHaveLength(60);
    expect(IAM_NOTIFICATIONS.map(({ recipientId }) => recipientId)).toEqual(
      IAM_ACCOUNTS.map(({ accountId }) => accountId),
    );
    expect(IAM_NOTIFICATION_PREFERENCES).toHaveLength(60);
    expect(IAM_NOTIFICATION_PREFERENCES.map(({ userId }) => userId)).toEqual(
      IAM_ACCOUNTS.map(({ accountId }) => accountId),
    );
  });

  it('covers every staff account with KYC and excludes patients', () => {
    const staffAccounts = IAM_ACCOUNTS.filter(({ role }) => role !== 'PATIENT');

    expect(IAM_KYC_VERIFICATIONS).toHaveLength(staffAccounts.length);
    expect(IAM_KYC_VERIFICATIONS.map(({ userId }) => userId)).toEqual(staffAccounts.map(({ accountId }) => accountId));
    expect(
      IAM_KYC_VERIFICATIONS.some(({ userId }) =>
        IAM_ACCOUNTS.some(({ accountId, role }) => accountId === userId && role === 'PATIENT'),
      ),
    ).toBe(false);
    expect(new Set(IAM_KYC_VERIFICATIONS.map(({ idNumber }) => idNumber)).size).toBe(staffAccounts.length);
    expect(IAM_KYC_VERIFICATIONS.every(({ idNumber }) => /^\d{12}$/.test(idNumber))).toBe(true);
  });

  it('keeps staff verification records aligned and ephemeral records absent', () => {
    const staffIds = IAM_ACCOUNTS.filter(({ role }) => role !== 'PATIENT').map(({ accountId }) => accountId);

    expect(IAM_PHONE_VERIFICATIONS.map(({ userId }) => userId)).toEqual(staffIds);
    expect(IAM_AUDIT_LOGS.map(({ userId }) => userId)).toEqual(staffIds);
    expect(IAM_NOTIFICATION_DELIVERY_LOGS.map(({ notificationId }) => notificationId)).toEqual(
      IAM_NOTIFICATIONS.map(({ notificationId }) => notificationId),
    );
    expect(new Set(IAM_PHONE_VERIFICATIONS.map(({ verificationId }) => verificationId)).size).toBe(staffIds.length);
  });

  it('uses business-safe language across all persistent fixtures', () => {
    const businessValues = JSON.stringify({
      accounts: IAM_ACCOUNTS,
      roles: IAM_ROLES,
      kycVerifications: IAM_KYC_VERIFICATIONS,
      auditLogs: IAM_AUDIT_LOGS,
      deliveryLogs: IAM_NOTIFICATION_DELIVERY_LOGS,
      phoneVerifications: IAM_PHONE_VERIFICATIONS,
      notificationTemplate: IAM_NOTIFICATION_TEMPLATE,
      notifications: IAM_NOTIFICATIONS,
      notificationPreferences: IAM_NOTIFICATION_PREFERENCES,
    });

    expect(businessValues).not.toMatch(bannedBusinessTerms);
  });
});
