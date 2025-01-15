import { NextResponse } from 'next/server';
import { transporter } from '@/utils/email';

export async function POST(request: Request) {
  try {
    const { email, images } = await request.json();

    if (!email || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attachments = images.map((image, index) => ({
      filename: `image-${index + 1}.jpg`,
      content: Buffer.from(image.split(',')[1], 'base64'),
      contentType: 'image/jpeg',
    }));

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your AI Transformed Selfie',
      html: `<p>Here are your AI-transformed selfies!</p>`,
      attachments,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
