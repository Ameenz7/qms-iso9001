import { Injectable, Logger } from '@nestjs/common';

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Minimal email delivery service. Uses Resend's HTTPS API if RESEND_API_KEY
 * is configured; otherwise logs the email to stdout (useful for dev without
 * an SMTP/provider setup).
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private get apiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  }

  private get from(): string {
    return process.env.MAIL_FROM ?? 'QMS <onboarding@resend.dev>';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(params: SendMailParams): Promise<{ id?: string; skipped?: true }> {
    if (!this.isConfigured) {
      this.logger.warn(
        `RESEND_API_KEY not set — skipping email to ${params.to}. Subject: ${params.subject}`,
      );
      return { skipped: true };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(
        `Resend send failed: ${res.status} ${res.statusText} — ${body}`,
      );
      throw new Error(`Email send failed (${res.status})`);
    }

    const json = (await res.json()) as { id?: string };
    return { id: json.id };
  }
}
