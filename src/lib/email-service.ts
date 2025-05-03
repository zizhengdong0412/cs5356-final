'use server';

// This is a mock email service that would be replaced with a real email provider
// like SendGrid, Mailgun, AWS SES, etc. in production

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean }> {
  const { to, subject, html, from = 'recipes@example.com' } = options;
  
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('========== EMAIL SENT ==========');
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(html);
    console.log('===============================');
    
    return { success: true };
  }
  
  // In production, you would connect to an email service
  try {
    // Example with a hypothetical email client:
    // await emailClient.send({
    //   from,
    //   to,
    //   subject,
    //   html,
    // });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false };
  }
}