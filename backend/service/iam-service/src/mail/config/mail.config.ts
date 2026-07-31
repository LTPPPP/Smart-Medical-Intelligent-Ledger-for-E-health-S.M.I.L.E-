import { registerAs } from '@nestjs/config';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  MAIL_HOST: string;

  @IsNumber()
  @IsOptional()
  MAIL_PORT: number;

  @IsString()
  @IsOptional()
  MAIL_USER: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD: string;

  @IsString()
  @IsOptional()
  MAIL_FROM: string;

  @IsString()
  @IsOptional()
  MAIL_SECURE: string;

  @IsString()
  @IsOptional()
  MAIL_REQUIRE_TLS: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.MAIL_HOST || 'localhost',
    port: parseInt(process.env.MAIL_PORT, 10) || 1025,
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'noreply@smile.com',
    // secure=true for implicit TLS (smtp.gmail.com:465); requireTls=true for
    // STARTTLS on 587. Both default false so maildev keeps working in dev.
    secure: process.env.MAIL_SECURE === 'true',
    requireTls: process.env.MAIL_REQUIRE_TLS === 'true',
  };
});
