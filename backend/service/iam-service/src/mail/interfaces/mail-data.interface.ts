export interface MailDataInterface {
  to: string;
  data: {
    hash?: string;
    hashR?: string;
    [key: string]: any;
  };
}
