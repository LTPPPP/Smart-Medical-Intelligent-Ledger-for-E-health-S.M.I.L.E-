import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { AccountsService } from '../accounts/accounts.service';
import { RoleEnum } from '../accounts/domain/account';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRoleEntity, 'iamUserConnection')
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(RoleEntity, 'iamUserConnection')
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly accountsService: AccountsService,
  ) {}

  // RolesGuard/JWT Only Ever Check account.role — Sync It So Assigning A
  // System Role (Admin/Doctor/...) Actually Grants Access, Not Just A Tag.
  private async syncPrimaryRoleIfSystemRole(
    userId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { role_id: roleId } });
    const systemRole = Object.values(RoleEnum).find((r) => r === role?.role_name);
    if (systemRole) {
      await this.accountsService.updateRole(userId, systemRole);
    }
  }

  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRoleEntity> {
    const existing = await this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId },
    });
    if (existing) {
      throw new ConflictException('Role already assigned to this user');
    }
    const userRole = this.userRoleRepository.create({
      id: uuidv4(),
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy ?? null,
    });
    const saved = await this.userRoleRepository.save(userRole);
    await this.syncPrimaryRoleIfSystemRole(userId, roleId);
    return saved;
  }

  async revokeRole(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ user_id: userId, role_id: roleId });

    const role = await this.roleRepository.findOne({ where: { role_id: roleId } });
    const systemRole = Object.values(RoleEnum).find((r) => r === role?.role_name);
    if (!systemRole) return;

    // Only Fall Back To PATIENT If The Revoked Role Was The Active One —
    // Revoking An Unrelated Tag Must Not Downgrade The Account's Real Role.
    const account = await this.accountsService.findById(userId);
    if (account?.role === systemRole) {
      await this.accountsService.updateRole(userId, RoleEnum.PATIENT);
    }
  }

  async getRolesByUser(userId: string): Promise<RoleEntity[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { user_id: userId },
    });
    const roleIds = new Set(userRoles.map((ur) => ur.role_id));

    // The Account's Primary role Is What RolesGuard Actually Checks — Merge
    // Its Matching RoleEntity In So The "Manage Roles" Dialog Reflects Reality
    // Even When There's No user_roles Row Yet (E.g. A Just-Registered Account).
    const account = await this.accountsService.findById(userId);
    if (account?.role) {
      const primaryRole = await this.roleRepository.findOne({
        where: { role_name: account.role },
      });
      if (primaryRole) roleIds.add(primaryRole.role_id);
    }

    if (roleIds.size === 0) return [];
    return this.roleRepository
      .createQueryBuilder('r')
      .where('r.role_id IN (:...ids)', { ids: [...roleIds] })
      .orderBy('r.role_name', 'ASC')
      .getMany();
  }

  async getUsersByRole(roleId: string): Promise<UserRoleEntity[]> {
    return this.userRoleRepository.find({ where: { role_id: roleId } });
  }
}
