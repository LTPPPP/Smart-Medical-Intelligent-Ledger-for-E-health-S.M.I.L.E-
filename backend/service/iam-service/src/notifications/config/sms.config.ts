import { registerAs } from '@nestjs/config';
import { IsString, IsOptional } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { SmsConfig } from './sms-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  TWILIO_ENABLED: string;

  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN: string;

  @IsString()
  @IsOptional()
  TWILIO_FROM: string;
}

export default registerAs<SmsConfig>('sms', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    enabled: process.env.TWILIO_ENABLED === 'true',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM || '',
  };
});
