import sgMail from "@sendgrid/mail";

console.log("SENDGRID KEY:", process.env.SENDGRID_API_KEY);
console.log("EMAIL FROM:", process.env.EMAIL_FROM);
if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM) {
  throw new Error("Missing SENDGRID_API_KEY or EMAIL_FROM in environment");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send a notification email
 * @param to Receiver email
 * @param subject Email subject
 * @param text Email body (plain text)
 */
export async function sendEmailNotification({
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
      from: process.env.EMAIL_FROM!,
      subject,
      text,
    };

    await sgMail.send(msg);
    console.log("✅ Email sent to", to);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error };
  }
}

