import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRoleEntity, 'iamUserConnection')
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(RoleEntity, 'iamUserConnection')
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

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
    return this.userRoleRepository.save(userRole);
  }

  async revokeRole(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ user_id: userId, role_id: roleId });
  }

  async getRolesByUser(userId: string): Promise<RoleEntity[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { user_id: userId },
    });
    if (userRoles.length === 0) return [];
    const roleIds = userRoles.map((ur) => ur.role_id);
    return this.roleRepository
      .createQueryBuilder('r')
      .where('r.role_id IN (:...ids)', { ids: roleIds })
      .orderBy('r.role_name', 'ASC')
      .getMany();
  }

  async getUsersByRole(roleId: string): Promise<UserRoleEntity[]> {
    return this.userRoleRepository.find({ where: { role_id: roleId } });
  }
}
