export type AllConfigType = {
  [key: string]: any;
} & {
  database: {
    isDocumentDatabase: boolean;
    url?: string;
    type?: string;
    host?: string;
    port?: number;
    password?: string;
    name?: string;
    username?: string;
    synchronize: boolean;
    maxConnections: number;
    sslEnabled: boolean;
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
  auth: {
    secret: string;
    expires: string;
    refreshSecret: string;
    refreshExpires: string;
    forgotSecret: string;
    forgotExpires: string;
    confirmEmailSecret: string;
    confirmEmailExpires: string;
    otpExpires: string;
  };
  app: {
    port: number;
    host: string;
    url: string;
    fallbackLanguage: string;
    headerLanguage: string;
  };
  mail: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
  facebook: {
    appId: string;
    appSecret: string;
  };
  apple: {
    clientId: string;
    clientSecret: string;
    teamId: string;
    keyId: string;
  };
};
