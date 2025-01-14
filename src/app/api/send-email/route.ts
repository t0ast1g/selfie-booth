import { NextResponse } from 'next/server';
import { transporter } from '@/utils/email';

export async function POST(request: Request) {
  console.log("Request", request);

  try {
    const { email, image } = await request.json();
    
    console.log('Sending email to:', email);
    console.log("Image", image);

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
