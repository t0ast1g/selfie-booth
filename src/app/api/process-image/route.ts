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
        wizard: "solo wizard wearing elaborate wizard robes, holding a magical staff, empty mystical library with floating books and magical artifacts, glowing magical aura, intricate magical symbols",
        superhero: "solo superhero wearing a superhero costume, dynamic action pose, empty city skyline background, dramatic lighting, cape flowing in the wind, superhero atmosphere",
        knight: "solo knight wearing medieval knight armor, holding a sword and shield, empty castle background, torches on stone walls, medieval fantasy setting",
        // Add more theme-specific prompts as needed
      };

      const defaultPrompt = "solo character in detailed themed environment, empty background scene, full body shot, dynamic composition";
      return themePrompts[baseTheme.toLowerCase()] || `${baseTheme}, ${defaultPrompt}`;
    };

    const output = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: imageUrl,
          prompt: isEdit
            ? `solo portrait photo of the person, no other people, detailed background, ${customPrompt}, detailed environment, cinematic composition`
            : `solo portrait photo of the person, no other people, detailed background, ${buildThemePrompt(theme)}, ${style} style, detailed environment, cinematic composition, high detail background, full body shot`,
          negative_prompt: "(multiple people, crowd, group, background people, other people:1.8), (additional faces, extra people:1.8), (lowres, low quality, worst quality:1.2), (text:1.2), watermark, painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured",
          
          // SDXL base weights
          sdxl_weights: "protovision-xl-high-fidel",
          
          // Face detection settings
          face_detection_input_width: 640,
          face_detection_input_height: 640,
          
          // Scheduler and steps
          scheduler: "EulerDiscreteScheduler",
          num_inference_steps: 30,
          guidance_scale: 5,
          
          // Adapter scales
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          
          // ControlNet settings
          enable_pose_controlnet: true,
          pose_strength: 0.4,
          enable_canny_controlnet: false,
          canny_strength: 0.3,
          enable_depth_controlnet: false,
          depth_strength: 0.5,
          
          // LCM settings
          enable_lcm: false,
          lcm_num_inference_steps: 5,
          lcm_guidance_scale: 1.5,
          
          // Enhancement and output settings
          enhance_nonface_region: true,
          output_format: "webp",
          output_quality: 80,
          
          // Optional settings
          seed: Math.floor(Math.random() * 1000000),
          num_outputs: 1,
        }
      }
    );

    console.log('Replicate output:', output);

    const processedImageUrls = Array.isArray(output) ? output : [output];

    if (!processedImageUrls.length) {
      throw new Error('No output received from Replicate');
    }

    return NextResponse.json({
      processedImages: processedImageUrls,
      processedImage: processedImageUrls[0]
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}