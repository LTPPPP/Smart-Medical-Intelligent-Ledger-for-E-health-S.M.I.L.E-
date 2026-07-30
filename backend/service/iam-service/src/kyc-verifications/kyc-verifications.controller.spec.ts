import { ROLES_KEY } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { KycVerificationsController } from './kyc-verifications.controller';

describe('KycVerificationsController roles', () => {
  const staffRoles = [
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
  ];

  it.each(['submitMine', 'findMine', 'findMineHistory'] as const)(
    'allows staff, but not patients, to call %s',
    (method) => {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        KycVerificationsController.prototype[method],
      );

      expect(roles).toEqual(staffRoles);
      expect(roles).not.toContain(RoleEnum.PATIENT);
    },
  );

  it('allows only admins to approve KYC submissions', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      KycVerificationsController.prototype.approve,
    );

    expect(roles).toEqual([RoleEnum.ADMIN]);
  });
});
