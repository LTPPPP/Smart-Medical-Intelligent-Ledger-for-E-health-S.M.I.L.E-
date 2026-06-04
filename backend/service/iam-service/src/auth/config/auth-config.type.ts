export interface AuthConfig {
  jwtSecret: string;
  secret: string;
  expires: string;
  jwtTokenExpiresIn: string;
  refreshSecret: string;
  refreshExpires: string;
  forgotSecret: string;
  forgotExpires: string;
  confirmEmailSecret: string;
  confirmEmailExpires: string;
  otpExpires: string;
}
