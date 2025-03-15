
import { NextResponse } from "next/server";
import { transporter } from "@/utils/email";

export async function POST(request: Request) {
  try {
    const { email, images } = await request.json();

    if (!email || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate that all images are valid base64 strings
    const validImages = images.filter(image => 
      image && typeof image === 'string' && image.includes(',')
    );

    if (validImages.length === 0) {
      return NextResponse.json(
        { error: "No valid images provided" },
        { status: 400 },
      );
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST || !process.env.SMTP_PORT) {
      console.error("Missing SMTP configuration");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const attachments = validImages.map((image, index) => ({
      filename: `image-${index + 1}.jpg`,
      content: Buffer.from(image.split(",")[1], "base64"),
      contentType: "image/jpeg",
    }));

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Your AI Transformed Selfie",
        html: `<p>Here are your AI-transformed selfies!</p>`,
        attachments,
      });
    } catch (mailError) {
      console.error("Transporter error:", mailError);
      return NextResponse.json(
        { error: "SMTP error: " + (mailError as Error).message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
