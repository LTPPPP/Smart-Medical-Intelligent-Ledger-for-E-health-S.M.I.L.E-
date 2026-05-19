import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentRoomDto } from './create-treatment-room.dto';

export class UpdateTreatmentRoomDto extends PartialType(CreateTreatmentRoomDto) {}
