import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailDataInterface } from '@auth/mail/interfaces/mail-data.interface';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService<any>) {
    const host = this.configService.get('mail.host', { infer: true });
    const port = this.configService.get('mail.port', { infer: true });
    const secure = this.configService.get('mail.secure', { infer: true });
    const requireTls = this.configService.get('mail.requireTls', {
      infer: true,
    });
    const user = this.configService.get('mail.user', { infer: true });
    const password = this.configService.get('mail.password', { infer: true });

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: requireTls,
      // Auth only when a user is configured — maildev and other open relays
      // reject or ignore empty credentials.
      ...(user ? { auth: { user, pass: password } } : {}),
    } as any);
  }

  async userSignUp(mailData: MailDataInterface): Promise<void> {
    await this.sendMail({
      to: mailData.to,
      subject: 'Confirm your email',
      text: `Welcome to S.M.I.L.E! Please confirm your email by clicking the link: ${mailData.data.hash}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to S.M.I.L.E!</h1>
          <p>Thank you for registering. Please confirm your email by clicking the button below:</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/auth/email/confirm?hash=${mailData.data.hash}"
             style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
            Confirm Email
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${process.env.APP_URL || 'http://localhost:3000'}/auth/email/confirm?hash=${mailData.data.hash}</p>
        </div>
      `,
    });
  }

  async forgotPassword(mailData: MailDataInterface): Promise<void> {
    await this.sendMail({
      to: mailData.to,
      subject: 'Reset your password',
      text: `You requested a password reset. Use this link: ${mailData.data.hash}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Reset Your Password</h1>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?hash=${mailData.data.hash}"
             style="display: inline-block; padding: 12px 24px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?hash=${mailData.data.hash}</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    });
  }

  async confirmNewEmail(mailData: MailDataInterface): Promise<void> {
    await this.sendMail({
      to: mailData.to,
      subject: 'Confirm your new email',
      text: `Confirm your new email by clicking the link: ${mailData.data.hash}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Confirm Your New Email</h1>
          <p>You requested to change your email. Please confirm by clicking the button below:</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/auth/email/confirm?hash=${mailData.data.hash}"
             style="display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px;">
            Confirm Email
          </a>
        </div>
      `,
    });
  }

  private async sendMail({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get('mail.from', { infer: true });

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }

  /** Send Notification Email */
  async sendNotificationEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    await this.sendMail({
      to,
      subject,
      text: html.replace(/<[^>]*>/g, ''), // Strip Html Fallback
      html,
    });
  }
}
