import { registerAs } from '@nestjs/config';
import { RedisConfig } from './redis-config.type';
import validateConfig from '.././utils/validate-config';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_URL: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_CACHE_TTL_SECONDS: number;
}

export default registerAs<RedisConfig>('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    // Shared Redis Instance
    url: process.env.REDIS_URL || 'redis://localhost:6379/1',
    cacheTtlSeconds: process.env.REDIS_CACHE_TTL_SECONDS
      ? parseInt(process.env.REDIS_CACHE_TTL_SECONDS, 10)
      : 300,
  };
});
