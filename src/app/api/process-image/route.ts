import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API token not configured' },
      { status: 500 }
    );
  }

  try {
    const {
      image,
      theme,
      style,
      isEdit = false,
      customPrompt = '',
    } = await request.json();

    if (!image || (!isEdit && (!theme || !style))) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const base64Data = image.split(',')[1];
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;

    const buildThemePrompt = (baseTheme: string) => {
      const themePrompts: { [key: string]: string } = {
        superhero: "solo superhero wearing a superhero costume, dynamic action pose, empty city skyline background, dramatic lighting, cape flowing in the wind, superhero atmosphere",
        knight: "solo knight wearing medieval knight armor, holding a sword and shield, empty castle background, torches on stone walls, medieval fantasy setting",
        "cartoon princess/prince": "Animated cartoon style, royalty, castle background, illustrated cartoon, anime, cute, illustration, drawn features",
        "minecraft/roblox/lego character": "Blocky, game-accurate style, cartoon, animated, playful colors"
      };

      const defaultPrompt = "solo character in detailed themed environment, empty background scene, dynamic composition";
      return themePrompts[baseTheme.toLowerCase()] || `${baseTheme}, ${defaultPrompt}`;
    };

    const themePrompt = isEdit
      ? `solo portrait photo of the person, no other people, detailed background, ${customPrompt}, detailed environment`
      : `solo portrait photo of the person, no other people, detailed background, ${buildThemePrompt(theme)}, ${style} style, detailed environment, high detail background`;

    const headshotPrompt = `solo portrait headshot of the person, plain neutral background, sharp focus, cinematic lighting, professional business headshot, ultra-detailed`;

    const themeOutput = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: imageUrl,
          prompt: themePrompt,
          negative_prompt: "(multiple people, crowd, group, background people, other people:1.8), (additional faces, extra people:1.8), (lowres, worst quality:1.2), (text:1.2), watermark, glitch, cross-eyed, ugly",
          sdxl_weights: "protovision-xl-high-fidel",
          face_detection_input_width: 640,
          face_detection_input_height: 640,
          scheduler: "EulerDiscreteScheduler",
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.8,
		  enable_lcm: true,
          controlnet_conditioning_scale: 0.8,
          enhance_nonface_region: true,
          output_format: "webp",
          output_quality: 80,
          seed: Math.floor(Math.random() * 1000000),
        },
      }
    );

    const headshotOutput = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: imageUrl,
          prompt: headshotPrompt,
          negative_prompt: "(multiple people, crowd, group, background people, other people:1.8), (additional faces, extra people:1.8), (lowres, low quality, worst quality:1.2), (text:1.2), watermark, glitch, deformed, mutated, cross-eyed, ugly, disfigured",
          sdxl_weights: "protovision-xl-high-fidel",
          face_detection_input_width: 640,
          face_detection_input_height: 640,
          scheduler: "EulerDiscreteScheduler",
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          enhance_nonface_region: true,
          output_format: "webp",
          output_quality: 80,
          seed: Math.floor(Math.random() * 1000000),
        },
      }
    );

    const themeImage = Array.isArray(themeOutput) ? themeOutput[0] : themeOutput;
    const headshotImage = Array.isArray(headshotOutput) ? headshotOutput[0] : headshotOutput;

    if (!themeImage || !headshotImage) {
      throw new Error('Failed to generate all required images');
    }

    return NextResponse.json({
      themeImage,
      headshotImage,
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
