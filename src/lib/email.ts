// src/lib/email.ts
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const EMAIL_FROM = process.env.EMAIL_FROM!;

sgMail.setApiKey(SENDGRID_API_KEY);

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  try {
    const msg = {
      to,
      from: EMAIL_FROM,
      subject,
      text,
    };

    const response = await sgMail.send(msg);
    return { success: true, response };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false, error };
  }
}
