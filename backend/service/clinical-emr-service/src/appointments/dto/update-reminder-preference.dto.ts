import { IsBoolean, IsInt, IsOptional, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { NOTIFICATION_CHANNEL_VALUES } from '../../utils/enums/notification-channel.enum';

export class UpdateReminderPreferenceDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel?: string;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  reminder_minutes_before?: number;
}
