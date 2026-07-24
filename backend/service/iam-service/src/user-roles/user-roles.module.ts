import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleEntity, RoleEntity], 'iamUserConnection'),
    AuditLogsModule,
  ],
  controllers: [UserRolesController],
  providers: [UserRolesService],
  exports: [UserRolesService],
})
export class UserRolesModule {}
