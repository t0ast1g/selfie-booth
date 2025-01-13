import { NextResponse } from 'next/server';
import { createTransporter } from '@/utils/email';

export async function POST(request: Request) {
  try {
    const { email, image } = await request.json();

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your AI Transformed Selfie',
      html: `<p>Here's your amazing AI-transformed selfie!</p>`,
      attachments: [
        {
          filename: 'ai-selfie.jpg',
          content: Buffer.from(image.split(',')[1], 'base64'),
          contentType: 'image/jpeg',
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}