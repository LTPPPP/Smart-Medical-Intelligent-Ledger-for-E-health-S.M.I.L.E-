import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentRoomsController } from './treatment-rooms.controller';
import { TreatmentRoomsService } from './treatment-rooms.service';
import { TreatmentRoomEntity } from './entities/treatment-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreatmentRoomEntity], 'clinicConnection'),
  ],
  controllers: [TreatmentRoomsController],
  providers: [TreatmentRoomsService],
  exports: [TreatmentRoomsService],
})
export class TreatmentRoomsModule {}
