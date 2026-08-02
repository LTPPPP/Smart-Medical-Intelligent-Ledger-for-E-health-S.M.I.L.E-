export type IamSeedRole = 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'RECEPTIONIST' | 'NURSE' | 'PATIENT';

export interface IamSeedAccount {
  accountId: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: IamSeedRole;
  phone: string;
  gender: 1 | 2;
  dateOfBirth: string;
}

const SHARED_LOCAL_PASSWORD_HASH = '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6';

const PEOPLE: ReadonlyArray<readonly [IamSeedRole, string]> = [
  ['ADMIN', 'Evelyn Carter'],
  ['MANAGER', 'Olivia Bennett'],
  ['MANAGER', 'Daniel Foster'],
  ['DOCTOR', 'Amelia Nguyen'],
  ['DOCTOR', 'Benjamin Tran'],
  ['DOCTOR', 'Charlotte Le'],
  ['DOCTOR', 'David Pham'],
  ['DOCTOR', 'Emily Vo'],
  ['DOCTOR', 'Felix Bui'],
  ['DOCTOR', 'Grace Hoang'],
  ['DOCTOR', 'Henry Do'],
  ['RECEPTIONIST', 'Isabella Vu'],
  ['RECEPTIONIST', 'Jacob Truong'],
  ['RECEPTIONIST', 'Katherine Dang'],
  ['RECEPTIONIST', 'Liam Cao'],
  ['NURSE', 'Mia Huynh'],
  ['NURSE', 'Noah Ly'],
  ['NURSE', 'Sophia Lam'],
  ['NURSE', 'Ethan Dinh'],
  ['NURSE', 'Ava Mai'],
  ['PATIENT', 'Lucas Nguyen'],
  ['PATIENT', 'Emma Tran'],
  ['PATIENT', 'Oliver Le'],
  ['PATIENT', 'Chloe Pham'],
  ['PATIENT', 'James Vo'],
  ['PATIENT', 'Lily Bui'],
  ['PATIENT', 'William Hoang'],
  ['PATIENT', 'Hannah Do'],
  ['PATIENT', 'Alexander Vu'],
  ['PATIENT', 'Zoe Truong'],
  ['PATIENT', 'Michael Dang'],
  ['PATIENT', 'Nora Cao'],
  ['PATIENT', 'Sebastian Huynh'],
  ['PATIENT', 'Ella Ly'],
  ['PATIENT', 'Jack Lam'],
  ['PATIENT', 'Maya Dinh'],
  ['PATIENT', 'Leo Mai'],
  ['PATIENT', 'Ruby Nguyen'],
  ['PATIENT', 'Theodore Tran'],
  ['PATIENT', 'Alice Le'],
  ['PATIENT', 'Samuel Pham'],
  ['PATIENT', 'Clara Vo'],
  ['PATIENT', 'Joseph Bui'],
  ['PATIENT', 'Lucy Hoang'],
  ['PATIENT', 'Daniel Do'],
  ['PATIENT', 'Eva Vu'],
  ['PATIENT', 'Matthew Truong'],
  ['PATIENT', 'Stella Dang'],
  ['PATIENT', 'Andrew Cao'],
  ['PATIENT', 'Ivy Huynh'],
  ['PATIENT', 'Gabriel Ly'],
  ['PATIENT', 'Anna Lam'],
  ['PATIENT', 'Nathan Dinh'],
  ['PATIENT', 'Rose Mai'],
  ['PATIENT', 'Thomas Nguyen'],
  ['PATIENT', 'Julia Tran'],
  ['PATIENT', 'Christopher Le'],
  ['PATIENT', 'Sarah Pham'],
  ['PATIENT', 'Jonathan Vo'],
  ['PATIENT', 'Violet Bui'],
];

const roleSlug: Record<IamSeedRole, string> = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  NURSE: 'nurse',
  PATIENT: 'patient',
};

const deterministicUuid = (prefix: string, index: number): string => `${prefix}${String(index).padStart(3, '0')}`;

export const IAM_ACCOUNTS: ReadonlyArray<IamSeedAccount> = PEOPLE.map(([role, fullName], index) => {
  const roleOrdinal = PEOPLE.slice(0, index + 1).filter(([candidateRole]) => candidateRole === role).length;
  const login = role === 'ADMIN' ? roleSlug[role] : `${roleSlug[role]}${roleOrdinal}`;
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 27) + 1).padStart(2, '0');

  return {
    accountId: deterministicUuid('550e8400-e29b-41d4-a716-446655440', index),
    username: login,
    email: `${login}@smile.com`,
    fullName,
    passwordHash: SHARED_LOCAL_PASSWORD_HASH,
    role,
    phone: `+8491${String(index + 1).padStart(8, '0')}`,
    gender: index % 2 === 0 ? 2 : 1,
    dateOfBirth: `${1970 + (index % 25)}-${month}-${day}`,
  };
});

export const IAM_ROLES = [
  {
    roleId: 'a0000000-0000-0000-0000-000000000001',
    roleName: 'ADMIN',
    description: 'System administrator with full access',
  },
  {
    roleId: 'a0000000-0000-0000-0000-000000000002',
    roleName: 'DOCTOR',
    description: 'Dental physician responsible for patient care',
  },
  {
    roleId: 'a0000000-0000-0000-0000-000000000003',
    roleName: 'RECEPTIONIST',
    description: 'Front desk coordinator',
  },
  {
    roleId: 'a0000000-0000-0000-0000-000000000004',
    roleName: 'PATIENT',
    description: 'Patient portal member',
  },
  {
    roleId: 'a0000000-0000-0000-0000-000000000005',
    roleName: 'MANAGER',
    description: 'Clinic operations manager',
  },
  {
    roleId: 'a0000000-0000-0000-0000-000000000006',
    roleName: 'NURSE',
    description: 'Clinical support nurse',
  },
] as const;

export const IAM_NOTIFICATION_TEMPLATE = {
  templateId: '660e8400-e29b-41d4-a716-446655440000',
  templateCode: 'ACCOUNT_READY',
  name: 'Account ready',
  description: 'Confirms that a S.M.I.L.E account is ready to use',
  subjectTemplate: 'Your S.M.I.L.E account is ready',
  bodyTemplate: 'Welcome {{fullName}}. Your S.M.I.L.E account is ready.',
  channel: 'APP',
} as const;

export const IAM_NOTIFICATIONS = IAM_ACCOUNTS.map((account, index) => ({
  notificationId: deterministicUuid('670e8400-e29b-41d4-a716-446655440', index),
  recipientId: account.accountId,
  subject: 'Your S.M.I.L.E account is ready',
  message: `Welcome ${account.fullName}. Your S.M.I.L.E account is ready.`,
  scheduledAt: '2026-01-01T00:00:00.000Z',
  sentAt: '2026-01-01T00:00:00.000Z',
}));

export const IAM_NOTIFICATION_PREFERENCES = IAM_ACCOUNTS.map((account, index) => ({
  preferenceId: deterministicUuid('680e8400-e29b-41d4-a716-446655440', index),
  userId: account.accountId,
  notificationType: 'ACCOUNT',
  channel: 'APP',
  isEnabled: true,
}));

const STAFF_ACCOUNTS = IAM_ACCOUNTS.filter(({ role }) => role !== 'PATIENT');
const STAFF_REVIEWER_ID = STAFF_ACCOUNTS.find(({ role }) => role === 'ADMIN')!.accountId;

export const IAM_KYC_VERIFICATIONS = STAFF_ACCOUNTS.map((account, index) => {
  const reviewedAt = `2026-01-${String((index % 20) + 2).padStart(2, '0')}T09:00:00.000Z`;
  const reviewerId = account.role === 'ADMIN' ? STAFF_ACCOUNTS[1].accountId : STAFF_REVIEWER_ID;
  const hashSource = account.accountId.replace(/-/g, '');

  return {
    kycId: deterministicUuid('690e8400-e29b-41d4-a716-446655440', index),
    userId: account.accountId,
    idType: 'CITIZEN_ID',
    idNumber: String(790000000001 + index).padStart(12, '0'),
    fullName: account.fullName,
    dateOfBirth: account.dateOfBirth,
    verificationStatus: 'VERIFIED',
    ocrStatus: 'SKIPPED',
    documentHash: `${hashSource}${hashSource}`,
    notes: 'Staff identity reviewed during onboarding.',
    submittedAt: reviewedAt,
    verifiedAt: reviewedAt,
    verifiedBy: reviewerId,
    decisionSource: 'MANUAL',
    decisionReason: 'Identity document and employment record matched.',
    consentVersion: '2026-01',
    consentAcceptedAt: reviewedAt,
    processingPurpose: 'identity_verification_and_booking_safety',
    retentionPolicyVersion: 'staff-identity-2026-01',
    retentionExpiresAt: `2031-01-${String((index % 20) + 2).padStart(2, '0')}T09:00:00.000Z`,
  };
});

export const IAM_PHONE_VERIFICATIONS = STAFF_ACCOUNTS.map((account, index) => ({
  verificationId: deterministicUuid('6a0e8400-e29b-41d4-a716-446655440', index),
  userId: account.accountId,
  phone: account.phone,
  verifiedAt: `2026-01-${String((index % 20) + 2).padStart(2, '0')}T09:15:00.000Z`,
  isVerified: true,
}));

export const IAM_AUDIT_LOGS = IAM_KYC_VERIFICATIONS.map((kyc, index) => ({
  logId: deterministicUuid('6c0e8400-e29b-41d4-a716-446655440', index),
  userId: kyc.userId,
  action: 'KYC_VERIFIED',
  resource: 'kyc_verification',
  resourceId: kyc.kycId,
  details: {
    outcome: 'approved',
    decisionSource: kyc.decisionSource,
  },
  createdAt: kyc.verifiedAt,
}));

export const IAM_NOTIFICATION_DELIVERY_LOGS = IAM_NOTIFICATIONS.map((notification, index) => ({
  logId: deterministicUuid('6d0e8400-e29b-41d4-a716-446655440', index),
  notificationId: notification.notificationId,
  gatewayName: 'in_app',
  gatewayResponseId: `delivery-${String(index + 1).padStart(3, '0')}`,
  status: 'DELIVERED',
  createdAt: notification.sentAt,
}));
