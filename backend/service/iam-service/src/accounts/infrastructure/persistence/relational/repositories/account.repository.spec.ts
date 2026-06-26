import { AccountsRepository } from './account.repository';

describe('AccountsRepository', () => {
  it('updates editable profile fields on the account entity', async () => {
    const entity: Record<string, unknown> = { accountId: 'account-id' };
    const typeormRepository = {
      findOne: jest.fn(async () => entity),
      save: jest.fn(async (value) => value),
    };
    const repository = new AccountsRepository(typeormRepository as any);

    const result = await repository.update('account-id', {
      dateOfBirth: '1995-06-15',
      address: 'Da Nang',
      avatarUrl: 'https://example.test/avatar.png',
    } as any);

    expect(typeormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOfBirth: '1995-06-15',
        address: 'Da Nang',
        avatarUrl: 'https://example.test/avatar.png',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        dateOfBirth: '1995-06-15',
        address: 'Da Nang',
        avatarUrl: 'https://example.test/avatar.png',
      }),
    );
  });
});
