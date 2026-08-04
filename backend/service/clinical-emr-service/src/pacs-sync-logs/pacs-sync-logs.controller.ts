import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PacsSyncLogsService } from './pacs-sync-logs.service';
import { CreatePacsSyncLogDto } from './dto/create-pacs-sync-log.dto';
import { UpdatePacsSyncLogDto } from './dto/update-pacs-sync-log.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// Admin Only Logs
@ApiTags('Dental Images')
@Controller('pacs-sync-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
export class PacsSyncLogsController {
  constructor(private readonly pacsSyncLogsService: PacsSyncLogsService) {}

  @Post()
  create(@Body() createPacsSyncLogDto: CreatePacsSyncLogDto) {
    return this.pacsSyncLogsService.create(createPacsSyncLogDto);
  }

  @Get()
  findAll() {
    return this.pacsSyncLogsService.findAll();
  }

  @Get('failed')
  findFailed() {
    return this.pacsSyncLogsService.findFailed();
  }

  @Get('recent')
  findRecent(@Query('hours') hours: string) {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.pacsSyncLogsService.findRecent(hoursNum);
  }

  @Get(':sync_id')
  findOne(@Param('sync_id', ParseUUIDPipe) sync_id: string) {
    return this.pacsSyncLogsService.findOne(sync_id);
  }

  @Get('image/:image_id')
  findByImageId(@Param('image_id', ParseUUIDPipe) image_id: string) {
    return this.pacsSyncLogsService.findByImageId(image_id);
  }

  @Get('sync-type/:sync_type')
  findBySyncType(@Param('sync_type') sync_type: string) {
    return this.pacsSyncLogsService.findBySyncType(sync_type);
  }

  @Get('pacs-server/:pacs_server')
  findByPacsServer(@Param('pacs_server') pacs_server: string) {
    return this.pacsSyncLogsService.findByPacsServer(pacs_server);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.pacsSyncLogsService.findByStatus(status);
  }

  @Patch(':sync_id')
  update(
    @Param('sync_id', ParseUUIDPipe) sync_id: string,
    @Body() updatePacsSyncLogDto: UpdatePacsSyncLogDto,
  ) {
    return this.pacsSyncLogsService.update(sync_id, updatePacsSyncLogDto);
  }

  @Delete(':sync_id')
  remove(@Param('sync_id', ParseUUIDPipe) sync_id: string) {
    return this.pacsSyncLogsService.remove(sync_id);
  }
}
