import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('Missing email configuration environment variables');
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // Use secure for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendImageEmail(
  to: string,
  images: { filename: string; data: string }[]
): Promise<void> {
  try {
    const attachments = images.map((img) => ({
      filename: img.filename,
      content: Buffer.from(img.data.split(',')[1], 'base64'), // Decode base64
      contentType: 'image/jpeg', // Default to JPEG
    }));

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Your AI Transformed Images!',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Your AI Transformed Images</h1>
          <p>See your stunning AI-transformed photos below!</p>
        </div>
      `,
      attachments,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
