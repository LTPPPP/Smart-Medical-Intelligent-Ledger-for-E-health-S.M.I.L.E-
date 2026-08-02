import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { UserProfileEntity } from './entities/user-profile.entity';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { QueryUserProfileDto } from './dto/query-user-profile.dto';
import { AccountEntity } from '../accounts/infrastructure/persistence/relational/entities/account.entity';
import { v4 as uuidv4 } from 'uuid';

export type NullableType<T> = T | null;

export type IPaginationOptions = {
  limit: number;
  page: number;
};

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectRepository(UserProfileEntity, 'iamUserConnection')
    private readonly userProfileRepository: Repository<UserProfileEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async create(createUserProfileDto: CreateUserProfileDto, userId?: string): Promise<UserProfileEntity> {
    const newUser = this.userProfileRepository.create({
      user_id: userId ?? uuidv4(),
      full_name: createUserProfileDto.full_name,
      email: createUserProfileDto.email ?? null,
      phone: createUserProfileDto.phone ?? null,
      date_of_birth: createUserProfileDto.date_of_birth ? new Date(createUserProfileDto.date_of_birth) : null,
      gender: createUserProfileDto.gender ?? null,
      avatar_url: createUserProfileDto.avatar_url ?? null,
    });
    return this.userProfileRepository.save(newUser);
  }

  async findAll(query: QueryUserProfileDto): Promise<{ data: UserProfileEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<UserProfileEntity> = {};

    if (query.email) {
      where.email = ILike(`%${query.email}%`);
    }
    if (query.phone) {
      where.phone = ILike(`%${query.phone}%`);
    }
    if (query.full_name) {
      where.full_name = ILike(`%${query.full_name}%`);
    }
    // Allow Zero Value
    if (query.gender !== undefined) {
      where.gender = query.gender;
    }

    // role Lives On accounts (Default Connection), Not user_profiles —
    // Resolve Matching Ids There First.
    if (query.role) {
      const matches = await this.accountRepository.find({
        where: { role: query.role },
        select: ['accountId'],
      });
      where.user_id = In(matches.map((a) => a.accountId));
    }

    const [data, total] = await this.userProfileRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<UserProfileEntity>> {
    return this.userProfileRepository.findOne({ where: { user_id: id } });
  }

  async update(id: string, updateData: Partial<UserProfileEntity>): Promise<UserProfileEntity | null> {
    const user = await this.findById(id);
    if (!user) return null;
    
    Object.assign(user, updateData);
    return this.userProfileRepository.save(user);
  }

  async ban(id: string, reason?: string): Promise<UserProfileEntity | null> {
    const user = await this.findById(id);
    if (!user) return null;

    user.is_banned = true;
    user.banned_at = new Date();
    user.ban_reason = reason ?? null;
    return this.userProfileRepository.save(user);
  }

  async unban(id: string): Promise<UserProfileEntity | null> {
    const user = await this.findById(id);
    if (!user) return null;

    user.is_banned = false;
    user.banned_at = null;
    user.ban_reason = null;
    return this.userProfileRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userProfileRepository.delete({ user_id: id });
  }
}
