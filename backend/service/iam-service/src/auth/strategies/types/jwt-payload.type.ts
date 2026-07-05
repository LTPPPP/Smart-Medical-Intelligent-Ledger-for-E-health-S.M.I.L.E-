export type JwtPayloadType = {
  accountId: string;
  email: string | null;
  role: string;
  status: string;
  // Token id used for the Redis logout blacklist. Optional so tokens issued
  // before this claim existed keep validating.
  jti?: string;
  // Standard JWT expiry (seconds since epoch), added by jwtService.sign.
  exp?: number;
};
