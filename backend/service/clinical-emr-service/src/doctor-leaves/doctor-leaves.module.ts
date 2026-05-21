import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorLeavesController } from './doctor-leaves.controller';
import { DoctorLeavesService } from './doctor-leaves.service';
import { DoctorLeaveEntity } from './entities/doctor-leave.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorLeaveEntity], 'clinicConnection')],
  controllers: [DoctorLeavesController],
  providers: [DoctorLeavesService],
  exports: [DoctorLeavesService],
})
export class DoctorLeavesModule {}
