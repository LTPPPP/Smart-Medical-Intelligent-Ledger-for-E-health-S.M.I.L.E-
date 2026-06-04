import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkShiftsController } from './work-shifts.controller';
import { WorkShiftsService } from './work-shifts.service';
import { WorkShiftEntity } from './entities/work-shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkShiftEntity], 'clinicConnection')],
  controllers: [WorkShiftsController],
  providers: [WorkShiftsService],
  exports: [WorkShiftsService],
})
export class WorkShiftsModule {}
