export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const tokenBlacklistKey = (jti: string) => `auth:blacklist:${jti}`;

export const otpCooldownKey = (accountId: string, purpose: string) =>
  `auth:otp:cooldown:${purpose}:${accountId}`;

export const otpSendCountKey = (accountId: string, purpose: string) =>
  `auth:otp:sendcount:${purpose}:${accountId}`;

export const otpAttemptsKey = (accountId: string, purpose: string) =>
  `auth:otp:attempts:${purpose}:${accountId}`;
