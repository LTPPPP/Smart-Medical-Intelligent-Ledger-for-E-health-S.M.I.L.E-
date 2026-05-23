import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { v4 as uuidv4 } from 'uuid';

export type NullableType<T> = T | null;

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity, 'iamUserConnection')
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    const newRole = this.roleRepository.create({
      role_id: uuidv4(),
      role_name: createRoleDto.role_name,
      description: createRoleDto.description ?? null,
    });
    return this.roleRepository.save(newRole);
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find();
  }

  async findById(id: string): Promise<NullableType<RoleEntity>> {
    return this.roleRepository.findOne({ where: { role_id: id } });
  }

  async update(id: string, updateData: Partial<RoleEntity>): Promise<RoleEntity | null> {
    const role = await this.findById(id);
    if (!role) return null;
    Object.assign(role, updateData);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    await this.roleRepository.delete({ role_id: id });
  }
}
