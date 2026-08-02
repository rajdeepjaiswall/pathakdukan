import { Resend } from 'resend';

// RESEND_FROM_ADDRESS can be overridden via env var once the domain is verified.
// Default falls back to Resend's shared test domain so emails still work while
// the custom domain DNS records are pending verification.
const RESEND_FROM =
  process.env.RESEND_FROM_ADDRESS ||
  'Pathak Bhandar <onboarding@resend.dev>';

let resendClient: Resend | null = null;
function getClient(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email-service] RESEND_API_KEY is not set — email delivery is disabled.');
    return null;
  }
  resendClient = new Resend(key);
  return resendClient;
}

export interface SendOtpEmailResult {
  delivered: boolean;
  reason?: string;
}

/**
 * Delivery-only wrapper. The OTP itself is generated and stored by the existing
 * OTP service — this function does NOT touch any OTP state. It only emails the
 * code to the user. Failures are logged and reported back via the return value;
 * they never throw, so the caller can keep the OTP flow alive even if email
 * sending fails.
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  opts: { subject?: string; reasonText?: string } = {}
): Promise<SendOtpEmailResult> {
  if (!email) {
    return { delivered: false, reason: 'No email address on file.' };
  }

  const client = getClient();
  if (!client) {
    return { delivered: false, reason: 'Email service is not configured.' };
  }

  const subject = opts.subject || 'OTP to Confirm Phone Number Change';
  const reasonText =
    opts.reasonText ||
    'You have requested to change the phone number on your Pathak Bhandar account. Use the code below to confirm this change.';

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 22px;">Pathak Bhandar</h1>
        <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">Premium Bakery &amp; Confectionery</p>
      </div>

      <h2 style="color: #111827; text-align: center; margin: 0 0 12px; font-size: 20px;">Verify Your Request</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.5; text-align: center; margin: 0 0 20px;">
        ${reasonText}
      </p>

      <div style="background: #f3f4f6; padding: 22px; border-radius: 10px; text-align: center; margin: 0 0 18px;">
        <div style="font-size: 34px; letter-spacing: 12px; font-weight: 700; color: #1e3a8a;">${otp}</div>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin: 0 0 18px;">
        This code will expire in <strong>5 minutes</strong>.<br>
        If you did not request this change, please ignore this email — your account stays safe.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; margin-top: 24px; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
          This is an automated security message from Pathak Bhandar, Prayagraj.
        </p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: RESEND_FROM,
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error('[email-service] Resend returned error:', error);
      return { delivered: false, reason: typeof error === 'string' ? error : (error as any).message || 'Email send failed.' };
    }

    console.log('[email-service] OTP email queued:', data?.id || '(no id)');
    return { delivered: true };
  } catch (err: any) {
    console.error('[email-service] Failed to send OTP email:', err?.message || err);
    return { delivered: false, reason: 'Email service is temporarily unavailable.' };
  }
}
