import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateReminderPreferenceDto {
  @IsOptional()
  @IsString()
  channel?: string;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  reminder_minutes_before?: number;
}
