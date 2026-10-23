import nodemailer from 'nodemailer';
import { MailServerRepository, IMailServer } from '../models/MailServer';
import { IUser } from '../models/User';

export class MailService {
  /**
   * Create a nodemailer transporter instance from an IMailServer config
   */
  private static getTransporter(server: IMailServer) {
    const isPort465 = Number(server.port) === 465;
    return nodemailer.createTransport({
      host: server.host,
      port: Number(server.port),
      secure: server.secure ?? isPort465,
      auth: {
        user: server.username,
        pass: server.password,
      },
      tls: {
        // Do not fail on self-signed certificates
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
    });
  }

  /**
   * Verify SMTP connection with given server credentials
   */
  static async verifyServer(server: IMailServer): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = this.getTransporter(server);
      await transporter.verify();
      return { success: true, message: `Connected successfully to ${server.host}:${server.port}` };
    } catch (err: any) {
      console.warn(`[MailService] SMTP verification failed for ${server.host}:`, err.message);
      return {
        success: false,
        message: err.message || 'Failed to authenticate with SMTP server',
      };
    }
  }

  /**
   * Send arbitrary email using active mail server (or fallback to console preview)
   */
  static async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; previewOnly?: boolean }> {
    const activeServer = await MailServerRepository.getActive();

    if (!activeServer) {
      console.log(`\n======================================================`);
      console.log(`📨 [MAIL SERVICE - NO ACTIVE SMTP SERVER]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.text || options.html}`);
      console.log(`======================================================\n`);
      return { success: true, previewOnly: true };
    }

    try {
      const transporter = this.getTransporter(activeServer);
      const fromAddress = activeServer.fromEmail || activeServer.username;

      const info = await transporter.sendMail({
        from: `"SonicSplit AI" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`[MailService] Email successfully sent to ${options.to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.warn(`[MailService] Failed to send email via SMTP (${err.message}). Logging email preview instead:`);
      console.log(`\n======================================================`);
      console.log(`📨 [MAIL SERVICE - CONSOLE FALLBACK]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.text || options.html}`);
      console.log(`======================================================\n`);
      return { success: true, previewOnly: true };
    }
  }

  /**
   * Send Welcome & Signup Confirmation Email
   */
  static async sendWelcomeEmail(user: IUser) {
    const subject = `Welcome to SonicSplit AI - Your Next-Gen Stem Separator!`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #F1F5F9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #06B6D4, #7C3AED); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SONIC<span style="color: #67E8F9;">SPLIT</span> AI</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Neural Audio Stem & Vocal Isolation Platform</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin-top: 0;">Welcome, ${user.name}! 🎵</h2>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">Your SonicSplit AI account has been successfully created. You're now equipped with state-of-the-art Meta Demucs v4 hybrid neural isolation to extract lossless Vocals, Drums, Bass, and Instruments.</p>
          
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #E2E8F0; font-size: 14px; font-weight: 600;">Your Account Overview:</p>
            <p style="margin: 4px 0; color: #94A3B8; font-size: 13px;">• <strong>Email:</strong> ${user.email}</p>
            <p style="margin: 4px 0; color: #94A3B8; font-size: 13px;">• <strong>Active Plan:</strong> <span style="color: #38BDF8; font-weight: 600;">${user.packageSlug.toUpperCase()}</span></p>
            <p style="margin: 4px 0; color: #94A3B8; font-size: 13px;">• <strong>Role:</strong> ${user.role.toUpperCase()}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #06B6D4, #3B82F6); color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; box-shadow: 0 8px 20px rgba(6, 182, 212, 0.35);">
              Launch Stem Separation Studio
            </a>
          </div>

          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 36px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px;">
            Need help? Reply directly to this email or visit your account settings at any time.<br>
            SonicSplit AI • Empowering Sound Creators Everywhere
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject,
      html,
      text: `Welcome to SonicSplit AI, ${user.name}! Your account (${user.email}) is ready with plan: ${user.packageSlug}. Visit http://localhost:3000 to begin separating tracks.`,
    });
  }

  /**
   * Send Password Reset Email with PIN code & direct link
   */
  static async sendPasswordResetEmail(user: IUser, resetToken: string, pinCode: string) {
    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    const subject = `[SonicSplit AI] Password Recovery Code: ${pinCode}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #F1F5F9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #EF4444, #8B5CF6); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SONIC<span style="color: #FCA5A5;">SPLIT</span> AI</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Security & Password Recovery</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">We received a request to reset the password for your SonicSplit AI account (<strong>${user.email}</strong>). Use the verification code below or click the direct button:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: rgba(30, 41, 59, 0.9); border: 2px dashed #06B6D4; border-radius: 14px; padding: 18px 36px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38BDF8;">
              ${pinCode}
            </div>
            <p style="color: #64748B; font-size: 12px; margin-top: 8px;">Code valid for 1 hour</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.35);">
              Reset Password Online
            </a>
          </div>

          <p style="color: #94A3B8; font-size: 13px; line-height: 1.5;">If you did not request this password reset, please ignore this email. Your existing credentials remain completely safe.</p>

          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 36px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px;">
            SonicSplit AI • Automated Security Dispatch
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject,
      html,
      text: `Your password recovery code is: ${pinCode}. Or visit ${resetUrl} to reset your password. Valid for 1 hour.`,
    });
  }

  /**
   * Send Test Mail from Admin Panel
   */
  static async sendTestEmail(targetEmail: string, serverConfig?: IMailServer) {
    const server = serverConfig || (await MailServerRepository.getActive());
    if (!server) {
      throw new Error('No mail server configuration provided or active.');
    }

    const transporter = this.getTransporter(server);
    const fromAddress = server.fromEmail || server.username;

    const info = await transporter.sendMail({
      from: `"SonicSplit AI Admin" <${fromAddress}>`,
      to: targetEmail,
      subject: `[Test] SonicSplit AI SMTP Server Connection Verified ✅`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0B0F19; color: #FFF; border-radius: 12px; border: 1px solid #1E293B;">
          <h2 style="color: #38BDF8; margin-top: 0;">SMTP Verification Successful!</h2>
          <p>Your mail server <strong>${server.label}</strong> (${server.host}:${server.port}) is operating properly.</p>
          <p style="color: #94A3B8; font-size: 13px;">Sender: ${fromAddress}<br>Security: ${server.secure ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}</p>
        </div>
      `,
      text: `SMTP Verification Successful for server ${server.label} (${server.host}:${server.port}).`,
    });

    return { success: true, messageId: info.messageId };
  }
}
