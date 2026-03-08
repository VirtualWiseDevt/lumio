import { getEmailTransport } from "../config/email.js";

// ─── Send Wrapper ───────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<void> {
  const transport = getEmailTransport();
  await transport.send({ to, subject, html, text });
}

// ─── Shared Layout ──────────────────────────────────────────────────────────

function emailLayout(body: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #e50914; font-size: 28px; margin-bottom: 0;">Lumio</h1>
  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
  ${body}
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 12px;" />
  <p style="color: #999; font-size: 12px;">This is a transactional email from Lumio. You received this because you have an account at lumio.tv.</p>
</div>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display: inline-block; background: #e50914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">${text}</a>`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

// ─── Template Builders ──────────────────────────────────────────────────────

export function buildWelcomeEmail(name: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to Lumio!";
  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>Welcome to Lumio! We're thrilled to have you join us.</p>
  <p>Explore our library of movies, series, documentaries, and live TV -- all curated for you.</p>
  ${ctaButton("Start Watching", "https://lumio.tv")}
  <p>If you have any questions, feel free to reach out at <a href="mailto:support@lumio.tv">support@lumio.tv</a>.</p>
  <p>Enjoy!<br/>The Lumio Team</p>`);
  const text = `Hi ${name}, Welcome to Lumio! We're thrilled to have you join us. Explore our library of movies, series, documentaries, and live TV at https://lumio.tv. If you have any questions, reach out at support@lumio.tv. Enjoy! -- The Lumio Team`;
  return { subject, html, text };
}

export function buildPaymentSuccessEmail(
  name: string,
  data: {
    amount: number;
    planName: string;
    duration: string;
    expiresAt: Date;
    mpesaReceipt: string | null;
    couponDiscount?: number;
    creditsUsed?: number;
  },
): { subject: string; html: string; text: string } {
  const subject = "Payment Confirmed - Lumio";

  const deductionLines: string[] = [];
  if (data.couponDiscount && data.couponDiscount > 0) {
    deductionLines.push(
      `<tr><td style="padding: 4px 0; color: #666;">Coupon Discount</td><td style="padding: 4px 0; text-align: right; color: #2e7d32;">-${formatAmount(data.couponDiscount)}</td></tr>`,
    );
  }
  if (data.creditsUsed && data.creditsUsed > 0) {
    deductionLines.push(
      `<tr><td style="padding: 4px 0; color: #666;">Referral Credits</td><td style="padding: 4px 0; text-align: right; color: #2e7d32;">-${formatAmount(data.creditsUsed)}</td></tr>`,
    );
  }

  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>Your payment has been confirmed. Here's your receipt:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 4px 0; color: #666;">Plan</td><td style="padding: 4px 0; text-align: right; font-weight: bold;">${data.planName}</td></tr>
    <tr><td style="padding: 4px 0; color: #666;">Duration</td><td style="padding: 4px 0; text-align: right;">${data.duration}</td></tr>
    ${deductionLines.join("\n    ")}
    <tr><td style="padding: 4px 0; color: #666;">Amount Paid</td><td style="padding: 4px 0; text-align: right; font-weight: bold;">${formatAmount(data.amount)}</td></tr>
    ${data.mpesaReceipt ? `<tr><td style="padding: 4px 0; color: #666;">M-Pesa Receipt</td><td style="padding: 4px 0; text-align: right;">${data.mpesaReceipt}</td></tr>` : ""}
    <tr><td style="padding: 4px 0; color: #666;">Valid Until</td><td style="padding: 4px 0; text-align: right;">${formatDate(data.expiresAt)}</td></tr>
  </table>
  <p>Your subscription is now active. Enjoy streaming!</p>
  ${ctaButton("Start Watching", "https://lumio.tv")}
  <p>Thanks for choosing Lumio.</p>`);

  const textDeductions: string[] = [];
  if (data.couponDiscount && data.couponDiscount > 0) {
    textDeductions.push(`Coupon Discount: -${formatAmount(data.couponDiscount)}`);
  }
  if (data.creditsUsed && data.creditsUsed > 0) {
    textDeductions.push(`Referral Credits: -${formatAmount(data.creditsUsed)}`);
  }

  const text = `Hi ${name}, Your payment has been confirmed. Plan: ${data.planName}. Duration: ${data.duration}. ${textDeductions.length > 0 ? textDeductions.join(". ") + ". " : ""}Amount Paid: ${formatAmount(data.amount)}.${data.mpesaReceipt ? ` M-Pesa Receipt: ${data.mpesaReceipt}.` : ""} Valid Until: ${formatDate(data.expiresAt)}. Your subscription is now active. Enjoy streaming! -- Lumio`;
  return { subject, html, text };
}

export function buildPaymentFailureEmail(
  name: string,
  data: { planName: string; amount: number },
): { subject: string; html: string; text: string } {
  const subject = "Payment Failed - Lumio";
  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>Unfortunately, your payment of <strong>${formatAmount(data.amount)}</strong> for the <strong>${data.planName}</strong> plan could not be processed.</p>
  <p>This can happen if the transaction timed out or there were insufficient funds. Please try again from the billing page.</p>
  ${ctaButton("Try Again", "https://lumio.tv/billing")}
  <p>If you continue to have issues, please contact us at <a href="mailto:support@lumio.tv">support@lumio.tv</a>.</p>
  <p>Best regards,<br/>The Lumio Team</p>`);
  const text = `Hi ${name}, Unfortunately, your payment of ${formatAmount(data.amount)} for the ${data.planName} plan could not be processed. Please try again on the billing page at https://lumio.tv/billing. If you continue to have issues, contact us at support@lumio.tv. -- The Lumio Team`;
  return { subject, html, text };
}

export function buildPreExpiryEmail(
  name: string,
  data: { planName: string; expiresAt: Date; daysRemaining: number },
): { subject: string; html: string; text: string } {
  const subject = "Your Lumio subscription expires soon";
  const dayWord = data.daysRemaining === 1 ? "day" : "days";
  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>Your <strong>${data.planName}</strong> subscription expires in <strong>${data.daysRemaining} ${dayWord}</strong>, on <strong>${formatDate(data.expiresAt)}</strong>.</p>
  <p>Renew now to keep enjoying unlimited access to movies, series, documentaries, and live TV on Lumio.</p>
  ${ctaButton("Renew Subscription", "https://lumio.tv/billing")}
  <p>If you don't renew, your access will be paused after the expiry date.</p>
  <p>Best,<br/>The Lumio Team</p>`);
  const text = `Hi ${name}, Your ${data.planName} subscription expires in ${data.daysRemaining} ${dayWord}, on ${formatDate(data.expiresAt)}. Renew now at https://lumio.tv/billing to keep enjoying Lumio. -- The Lumio Team`;
  return { subject, html, text };
}

export function buildPostExpiryEmail(
  name: string,
  data: { planName: string; expiredAt: Date },
): { subject: string; html: string; text: string } {
  const subject = "Your Lumio subscription has expired";
  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>Your <strong>${data.planName}</strong> subscription expired on <strong>${formatDate(data.expiredAt)}</strong>.</p>
  <p>You're missing out on our latest movies, series, documentaries, and live TV channels. Reactivate your subscription to pick up right where you left off.</p>
  ${ctaButton("Reactivate Subscription", "https://lumio.tv/billing")}
  <p>We'd love to have you back!</p>
  <p>Best,<br/>The Lumio Team</p>`);
  const text = `Hi ${name}, Your ${data.planName} subscription expired on ${formatDate(data.expiredAt)}. Reactivate your subscription at https://lumio.tv/billing to continue enjoying Lumio. We'd love to have you back! -- The Lumio Team`;
  return { subject, html, text };
}

export function buildReferralRewardEmail(
  name: string,
  data: { refereeName: string; creditsEarned: number; newBalance: number },
): { subject: string; html: string; text: string } {
  const subject = "You earned referral credits - Lumio";
  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>Great news! <strong>${data.refereeName}</strong> signed up using your referral, and you've earned <strong>${formatAmount(data.creditsEarned)}</strong> in referral credits.</p>
  <p>Your current credit balance is <strong>${formatAmount(data.newBalance)}</strong>. You can use these credits towards your next subscription payment.</p>
  ${ctaButton("View Billing", "https://lumio.tv/billing")}
  <p>Keep sharing and keep earning!</p>
  <p>Cheers,<br/>The Lumio Team</p>`);
  const text = `Hi ${name}, Great news! ${data.refereeName} signed up using your referral, and you've earned ${formatAmount(data.creditsEarned)} in referral credits. Your current credit balance is ${formatAmount(data.newBalance)}. Use them towards your next subscription at https://lumio.tv/billing. Keep sharing and keep earning! -- The Lumio Team`;
  return { subject, html, text };
}

export function buildPasswordResetEmail(
  name: string,
  data: { resetUrl: string },
): { subject: string; html: string; text: string } {
  const subject = "Reset your Lumio password";
  const html = emailLayout(`
  <p>Hi ${name},</p>
  <p>We received a request to reset your Lumio password. Click the button below to set a new password:</p>
  ${ctaButton("Reset Password", data.resetUrl)}
  <p>This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email -- your password will remain unchanged.</p>
  <p>Best,<br/>The Lumio Team</p>`);
  const text = `Hi ${name}, We received a request to reset your Lumio password. Visit this link to set a new password: ${data.resetUrl} -- This link expires in 1 hour. If you didn't request this, you can safely ignore this email. -- The Lumio Team`;
  return { subject, html, text };
}
