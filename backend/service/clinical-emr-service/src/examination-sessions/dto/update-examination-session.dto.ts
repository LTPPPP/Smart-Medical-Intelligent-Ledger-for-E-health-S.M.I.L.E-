import { PartialType } from '@nestjs/swagger';
import { CreateExaminationSessionDto } from './create-examination-session.dto';

export class UpdateExaminationSessionDto extends PartialType(
  CreateExaminationSessionDto,
) {}
