import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { InternalApiKeyGuard } from '../auth/guards/internal-api-key.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { Notification } from './domain/notification';
import { NotificationTemplate } from './domain/notification-template';
import { NotificationPreference } from './domain/notification-preference';
import { NullableType } from '@auth/utils/types/nullable.type';

@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Created only by other backend services (appointment/schedule notification
  // publishers) that call IAM directly, so this is guarded by the shared
  // internal API key rather than a user JWT.
  @Post()
  @UseGuards(InternalApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: Notification })
  createNotification(@Body() createDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.createNotification(createDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Notification] })
  findAllNotifications(@Query() query: QueryNotificationDto): Promise<Notification[]> {
    return this.notificationsService.findNotificationsWithPagination(
      { page: query.page ?? 1, limit: query.limit ?? 10 },
      query.filters,
      query.sort,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Notification })
  @ApiParam({ name: 'id', type: String, required: true })
  findOneNotification(@Param('id', ParseUUIDPipe) id: string): Promise<NullableType<Notification>> {
    return this.notificationsService.findNotificationById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Notification })
  @ApiParam({ name: 'id', type: String, required: true })
  updateNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNotificationDto,
  ): Promise<NullableType<Notification>> {
    return this.notificationsService.updateNotification(id, updateDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  removeNotification(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationsService.deleteNotification(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiParam({ name: 'id', type: String, required: true })
  markAsRead(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationsService.markAsRead(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Notification] })
  @ApiParam({ name: 'userId', type: String, required: true })
  findNotificationsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: QueryNotificationDto,
  ): Promise<Notification[]> {
    return this.notificationsService.findNotificationsWithPagination(
      { page: query.page ?? 1, limit: query.limit ?? 10 },
      { ...query.filters, recipientId: userId },
      query.sort,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('user/:userId/unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Number })
  @ApiParam({ name: 'userId', type: String, required: true })
  getUnreadCount(@Param('userId', ParseUUIDPipe) userId: string): Promise<number> {
    return this.notificationsService.getUnreadCount(userId);
  }
}

@ApiTags('Notification Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller({
  path: 'notification-templates',
  version: '1',
})
export class NotificationTemplatesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: NotificationTemplate })
  createTemplate(@Body() createDto: CreateNotificationTemplateDto): Promise<NotificationTemplate> {
    return this.notificationsService.createTemplate(createDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [NotificationTemplate] })
  findAllTemplates(): Promise<NotificationTemplate[]> {
    return this.notificationsService.findAllTemplates();
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: NotificationTemplate })
  @ApiParam({ name: 'code', type: String, required: true })
  findTemplateByCode(@Param('code') code: string): Promise<NullableType<NotificationTemplate>> {
    return this.notificationsService.findTemplateByCode(code);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: NotificationTemplate })
  @ApiParam({ name: 'id', type: String, required: true })
  findOneTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<NullableType<NotificationTemplate>> {
    return this.notificationsService.findTemplateById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: NotificationTemplate })
  @ApiParam({ name: 'id', type: String, required: true })
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNotificationTemplateDto,
  ): Promise<NullableType<NotificationTemplate>> {
    return this.notificationsService.updateTemplate(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  removeTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationsService.deleteTemplate(id);
  }
}

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'notification-preferences',
  version: '1',
})
export class NotificationPreferencesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: NotificationPreference })
  createPreference(@Body() createDto: CreateNotificationPreferenceDto): Promise<NotificationPreference> {
    return this.notificationsService.createPreference(createDto);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [NotificationPreference] })
  @ApiParam({ name: 'userId', type: String, required: true })
  findPreferencesByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<NotificationPreference[]> {
    return this.notificationsService.findPreferencesByUserId(userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: NotificationPreference })
  @ApiParam({ name: 'id', type: String, required: true })
  updatePreference(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ): Promise<NullableType<NotificationPreference>> {
    return this.notificationsService.updatePreference(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  removePreference(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationsService.deletePreference(id);
  }
}
