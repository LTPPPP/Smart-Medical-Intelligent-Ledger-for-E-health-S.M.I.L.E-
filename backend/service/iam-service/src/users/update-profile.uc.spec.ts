// GENERATED from Report5_Unit Test.xlsx — sheet "Update Profile" — 3 cases. Do not hand-edit.
//
// Target : UserProfilesService.update() — src/users/user-profiles.service.ts:71
// Symbol : EXACT (docs/audit/qa-recon-symbols.json)
// Split  : 0 DTO-validation / 3 service-behaviour
// Spec   : 1 MATCHES, 2 DIVERGES
//
// No canary, deliberately: update(id, updateData) takes a bare string and a
// `Partial<UserProfileEntity>` — not a validated DTO — so no ValidationPipe participates at
// this layer.
//
// Structurally identical to the "Update Role" sheet: both negative cases expect
// BadRequestException, `id` is unvalidated and a miss returns null rather than throwing, and
// an empty updateData is simply merged as a no-op.
// See docs/audit/uc-divergences.md D18.

import { UserProfilesService } from './user-profiles.service';
import { UC_IDS } from '../test-support/uc-fixtures';

const USER_ID = UC_IDS.userProfile;

function createService(existing: unknown) {
  const userProfileRepository = {
    findOne: jest.fn().mockResolvedValue(existing),
    save: jest.fn((value) => Promise.resolve(value)),
    create: jest.fn(),
    findAndCount: jest.fn(),
  };
  const service = new UserProfilesService(userProfileRepository as any);
  return { service, userProfileRepository };
}

function existingProfile() {
  return {
    user_id: USER_ID,
    full_name: 'Nguyen Van A',
    email: 'nguyen.a@example.com',
    phone: '+84900000001',
  };
}

describe('Update Profile — UserProfilesService.update()', () => {
  describe('service behaviour', () => {
    it('UTCID01 — merges the update into the existing profile and saves it [MATCHES]', async () => {
      const { service, userProfileRepository } = createService(existingProfile());

      const result = await service.update(USER_ID, { full_name: 'Nguyen Van B' } as any);

      expect(userProfileRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: USER_ID },
      });
      expect(result).toEqual(
        expect.objectContaining({
          user_id: USER_ID,
          full_name: 'Nguyen Van B',
          // Untouched fields survive the Object.assign (user-profiles.service.ts:75).
          email: 'nguyen.a@example.com',
        }),
      );
      expect(userProfileRepository.save).toHaveBeenCalledTimes(1);
    });

    it('UTCID02 — an empty id resolves to null instead of throwing [DIVERGES: SPEC_WRONG — id is an unvalidated argument, and a miss returns null rather than raising BadRequestException]', async () => {
      const { service, userProfileRepository } = createService(null);

      const result = await service.update('', { full_name: 'Nguyen Van B' } as any);

      expect(result).toBeNull();
      expect(userProfileRepository.findOne).toHaveBeenCalledWith({ where: { user_id: '' } });
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('UTCID03 — an empty updateData is accepted and the profile is saved unchanged [DIVERGES: SPEC_WRONG — updateData is a Partial<>, so an empty object is valid by construction]', async () => {
      const { service, userProfileRepository } = createService(existingProfile());

      const result = await service.update(USER_ID, {} as any);

      expect(result).toEqual(expect.objectContaining(existingProfile()));
      expect(userProfileRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
