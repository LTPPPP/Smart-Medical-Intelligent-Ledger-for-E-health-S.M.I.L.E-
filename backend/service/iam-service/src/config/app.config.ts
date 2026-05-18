import { registerAs } from '@nestjs/config';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import validateConfig from '../utils/validate-config';
import { AppConfig } from './app-config.type';

class EnvironmentVariablesValidator {
  @IsNumber()
  @IsOptional()
  APP_PORT: number;

  @IsString()
  @IsOptional()
  APP_HOST: string;

  @IsString()
  @IsOptional()
  APP_URL: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    host: process.env.APP_HOST || 'localhost',
    url: process.env.APP_URL || 'http://localhost:3000',
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'X-Custom-lang',
  };
});
