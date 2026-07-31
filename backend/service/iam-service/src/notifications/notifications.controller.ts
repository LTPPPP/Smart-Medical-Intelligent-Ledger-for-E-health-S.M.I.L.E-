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
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  NotificationActor,
  NotificationsService,
} from './notifications.service';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { InternalServiceGuard } from './guards/internal-service.guard';
import {
  RegisterPushSubscriptionDto,
  UnregisterPushSubscriptionDto,
} from './dto/register-push-subscription.dto';
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

/** The JWT strategy attaches the verified account; never trust a path param. */
function actorOf(request: {
  user: { accountId: string; role?: string };
}): NotificationActor {
  return { accountId: request.user.accountId, role: request.user.role };
}

@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushSubscriptionsService: PushSubscriptionsService,
    private readonly configService: ConfigService<any>,
  ) {}

  @Post()
  @UseGuards(InternalServiceGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: Notification })
  createNotification(@Body() createDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.createNotification(createDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Notification] })
  findAllNotifications(
    @Request() request,
    @Query() query: QueryNotificationDto,
  ): Promise<Notification[]> {
    return this.notificationsService.findNotificationsWithPagination(
      { page: query.page ?? 1, limit: query.limit ?? 10 },
      actorOf(request),
      query.filters,
      query.sort,
    );
  }

  @Get('vapid-public-key')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'VAPID public key for web push subscriptions' })
  getVapidPublicKey(): { publicKey: string } {
    return {
      publicKey: this.configService.get<string>('push.vapidPublicKey') || '',
    };
  }

  @Post('push-subscriptions')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Push subscription registered' })
  async registerPushSubscription(
    @Request() request,
    @Body() dto: RegisterPushSubscriptionDto,
  ): Promise<{ subscriptionId: string }> {
    const subscription = await this.pushSubscriptionsService.register(
      request.user.accountId,
      dto,
      request.headers?.['user-agent'],
    );
    return { subscriptionId: subscription.subscriptionId };
  }

  @Delete('push-subscriptions')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async unregisterPushSubscription(
    @Request() request,
    @Body() dto: UnregisterPushSubscriptionDto,
  ): Promise<void> {
    await this.pushSubscriptionsService.unregister(request.user.accountId, dto.endpoint);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Notification })
  @ApiParam({ name: 'id', type: String, required: true })
  findOneNotification(
    @Request() request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationsService.findNotificationById(id, actorOf(request));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Notification })
  @ApiParam({ name: 'id', type: String, required: true })
  updateNotification(
    @Request() request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.updateNotification(
      id,
      updateDto,
      actorOf(request),
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  removeNotification(
    @Request() request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificationsService.deleteNotification(id, actorOf(request));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiParam({ name: 'id', type: String, required: true })
  markAsRead(
    @Request() request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificationsService.markAsRead(id, actorOf(request));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Notification] })
  @ApiParam({ name: 'userId', type: String, required: true })
  findNotificationsByUser(
    @Request() request,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: QueryNotificationDto,
  ): Promise<Notification[]> {
    return this.notificationsService.findNotificationsWithPagination(
      { page: query.page ?? 1, limit: query.limit ?? 10 },
      actorOf(request),
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
  getUnreadCount(
    @Request() request,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<number> {
    return this.notificationsService.getUnreadCount(userId, actorOf(request));
  }
}

@ApiTags('Notification Templates')
@Controller({
  path: 'notification-templates',
  version: '1',
})
@UseGuards(InternalServiceGuard)
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
@Controller({
  path: 'notification-preferences',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class NotificationPreferencesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: NotificationPreference })
  createPreference(
    @Request() request,
    @Body() createDto: CreateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.createPreference(
      createDto,
      actorOf(request),
    );
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [NotificationPreference] })
  @ApiParam({ name: 'userId', type: String, required: true })
  findPreferencesByUser(
    @Request() request,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<NotificationPreference[]> {
    return this.notificationsService.findPreferencesByUserId(
      userId,
      actorOf(request),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: NotificationPreference })
  @ApiParam({ name: 'id', type: String, required: true })
  updatePreference(
    @Request() request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreference(
      id,
      updateDto,
      actorOf(request),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  removePreference(
    @Request() request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificationsService.deletePreference(id, actorOf(request));
  }
}
