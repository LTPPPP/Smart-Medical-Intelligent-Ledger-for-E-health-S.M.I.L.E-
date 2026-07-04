import { registerAs } from '@nestjs/config';
import { RedisConfig } from './redis-config.type';
import validateConfig from '../utils/validate-config';
import { IsOptional, IsString } from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_URL: string;
}

export default registerAs<RedisConfig>('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    // Shared Redis instance; payment-service owns logical DB 4.
    url: process.env.REDIS_URL || 'redis://localhost:6379/4',
  };
});
