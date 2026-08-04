export type JwtPayloadType = {
  accountId: string;
  email: string | null;
  role: string;
  status: string;
  // Logout Blacklist Id
  jti?: string;
  // Jwt Expiry
  exp?: number;
};
