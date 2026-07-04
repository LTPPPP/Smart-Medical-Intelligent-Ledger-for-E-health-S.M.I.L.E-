import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_URL: string;
}

export default registerAs('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    // Shared Redis instance; iam-service owns logical DB 3.
    url: process.env.REDIS_URL || 'redis://localhost:6379/3',
  };
});
