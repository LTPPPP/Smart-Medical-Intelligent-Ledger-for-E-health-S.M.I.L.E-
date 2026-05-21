import { PartialType } from '@nestjs/swagger';
import { CreateRecordExportDto } from './create-record-export.dto';

export class UpdateRecordExportDto extends PartialType(CreateRecordExportDto) {}
