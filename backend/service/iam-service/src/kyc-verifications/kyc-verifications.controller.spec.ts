import { ROLES_KEY } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { KycVerificationsController } from './kyc-verifications.controller';

describe('KycVerificationsController roles', () => {
  it('allows only admins to approve KYC submissions', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      KycVerificationsController.prototype.approve,
    );

    expect(roles).toEqual([RoleEnum.ADMIN]);
  });
});
