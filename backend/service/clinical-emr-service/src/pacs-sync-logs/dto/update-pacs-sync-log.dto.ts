import { PartialType } from '@nestjs/swagger';
import { CreatePacsSyncLogDto } from './create-pacs-sync-log.dto';

export class UpdatePacsSyncLogDto extends PartialType(CreatePacsSyncLogDto) {}
