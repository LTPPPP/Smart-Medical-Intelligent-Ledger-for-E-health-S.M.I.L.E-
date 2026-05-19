import { plainToInstance, Type } from 'class-transformer';
import { validateSync } from 'class-validator';

export default function validateConfig<T>(
  config: Record<string, unknown>,
  envClass: new () => T,
): T {
  const validatedConfig = plainToInstance(envClass, config as any, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig as any, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error: any) => {
      return Object.values(error.constraints || {}).join(', ');
    });
    throw new Error(`Config validation failed: ${errorMessages.join(', ')}`);
  }

  return validatedConfig as T;
}
