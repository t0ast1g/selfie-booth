import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("Missing email configuration environment variables");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendImageEmail(
  to: string,
  imageUrl: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Your AI Transformed Selfie!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Your AI Transformed Selfie</h1>
          <p style="color: #666; text-align: center;">Here's your amazing AI-transformed selfie!</p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="${imageUrl}" alt="AI Transformed Selfie" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          </div>
          <p style="color: #666; text-align: center;">
            Thank you for using our AI Selfie Booth!
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}