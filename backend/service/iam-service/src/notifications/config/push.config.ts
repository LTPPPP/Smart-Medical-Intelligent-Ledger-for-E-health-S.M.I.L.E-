import { registerAs } from '@nestjs/config';
import { IsString, IsOptional } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { PushConfig } from './push-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  VAPID_PUBLIC_KEY: string;

  @IsString()
  @IsOptional()
  VAPID_PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  VAPID_SUBJECT: string;
}

export default registerAs<PushConfig>('push', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:noreply@smile.com',
  };
});
