export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const tokenBlacklistKey = (jti: string) => `auth:blacklist:${jti}`;
