import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity, 'iamUserConnection')
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity, 'iamUserConnection')
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
  ) {}

  /** Derive Resource Action */
  private deriveResourceAction(permissionName: string): { resource: string; action: string } {
    const parts = permissionName.split('.');
    if (parts.length >= 2) {
      return { resource: parts.slice(0, -1).join('_'), action: parts[parts.length - 1] };
    }
    return { resource: permissionName, action: 'read' };
  }

  /** Backfill Resource Action */
  private normalise(p: PermissionEntity): PermissionEntity {
    if (!p.resource || !p.action) {
      const derived = this.deriveResourceAction(p.permission_name);
      p.resource = p.resource ?? derived.resource;
      p.action = p.action ?? derived.action;
    }
    return p;
  }

  async create(dto: CreatePermissionDto): Promise<PermissionEntity> {
    const existing = await this.permissionRepository.findOne({
      where: { permission_name: dto.permission_name },
    });
    if (existing) {
      throw new ConflictException(`Permission "${dto.permission_name}" already exists`);
    }
    const derived = this.deriveResourceAction(dto.permission_name);
    const permission = this.permissionRepository.create({
      permission_id: uuidv4(),
      permission_name: dto.permission_name,
      resource: dto.resource ?? derived.resource,
      action: dto.action ?? derived.action,
      description: dto.description ?? null,
    });
    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<PermissionEntity[]> {
    const perms = await this.permissionRepository.find({ order: { permission_name: 'ASC' } });
    return perms.map((p) => this.normalise(p));
  }

  async findById(id: string): Promise<PermissionEntity | null> {
    const p = await this.permissionRepository.findOne({ where: { permission_id: id } });
    return p ? this.normalise(p) : null;
  }

  async update(id: string, updateData: Partial<PermissionEntity>): Promise<PermissionEntity | null> {
    const permission = await this.findById(id);
    if (!permission) return null;
    Object.assign(permission, updateData);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    await this.rolePermissionRepository.delete({ permission_id: id });
    await this.permissionRepository.delete({ permission_id: id });
  }

  // Role Permission Management
  async assignPermissionToRole(roleId: string, permissionId: string, assignedBy?: string): Promise<RolePermissionEntity> {
    const existing = await this.rolePermissionRepository.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });
    if (existing) {
      throw new ConflictException('Permission already assigned to this role');
    }
    const rp = this.rolePermissionRepository.create({
      id: uuidv4(),
      role_id: roleId,
      permission_id: permissionId,
      assigned_by: assignedBy ?? null,
    });
    return this.rolePermissionRepository.save(rp);
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({ role_id: roleId, permission_id: permissionId });
  }

  async getPermissionsByRole(roleId: string): Promise<PermissionEntity[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role_id: roleId },
    });
    if (rolePermissions.length === 0) return [];
    const permissionIds = rolePermissions.map((rp) => rp.permission_id);
    const perms = await this.permissionRepository
      .createQueryBuilder('p')
      .where('p.permission_id IN (:...ids)', { ids: permissionIds })
      .orderBy('p.permission_name', 'ASC')
      .getMany();
    return perms.map((p) => this.normalise(p));
  }
}
