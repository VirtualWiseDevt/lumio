import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "./env.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

// ─── SMTP Transport ─────────────────────────────────────────────────────────

class SmtpTransport implements EmailTransport {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: `"Lumio" <${env.SMTP_FROM}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

// ─── Console Transport ──────────────────────────────────────────────────────

class ConsoleTransport implements EmailTransport {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[EMAIL] To: ${message.to}`);
    console.log(`[EMAIL] Subject: ${message.subject}`);
    console.log(
      `[EMAIL] Body preview: ${message.html.substring(0, 200)}...`,
    );
    console.log(`[EMAIL] ---`);
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

let transport: EmailTransport | null = null;

export function getEmailTransport(): EmailTransport {
  if (!transport) {
    transport =
      env.EMAIL_TRANSPORT === "smtp"
        ? new SmtpTransport()
        : new ConsoleTransport();
  }
  return transport;
}
