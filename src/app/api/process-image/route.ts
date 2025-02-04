import { NextResponse } from 'next/server';  
import Replicate from 'replicate';  
import { saveImageToDrive, testDriveSetup } from '@/utils/googleDrive';  

const replicate = new Replicate({  
  auth: process.env.REPLICATE_API_TOKEN,  
});  

async function downloadImageToBuffer(imageUrl: string): Promise<Buffer> {  
  console.log('Starting image download from URL:', imageUrl.substring(0, 50) + '...');  
  try {  
    const response = await fetch(imageUrl);  
    if (!response.ok) {  
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);  
    }  
    const arrayBuffer = await response.arrayBuffer();  
    const buffer = Buffer.from(arrayBuffer);  
    console.log('Image downloaded successfully, buffer size:', buffer.length);  
    return buffer;  
  } catch (error) {  
    console.error('Error downloading image:', error);  
    throw error;  
  }  
}  

export async function POST(request: Request) {  
  // Check all required environment variables  
  if (!process.env.REPLICATE_API_TOKEN || !process.env.GOOGLE_DRIVE_FOLDER_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {  
    console.error('Missing required environment variables');  
    return NextResponse.json(  
      { error: 'Server configuration incomplete' },  
      { status: 500 }  
    );  
  }  

  try {  
    // Test Google Drive setup at the start  
    console.log('Testing Google Drive setup...');  
    await testDriveSetup();  
    console.log('Google Drive setup verified');  

    const { image, theme, style, isEdit = false, customPrompt = '' } = await request.json();  

    if (!image || (!isEdit && (!theme || !style))) {  
      return NextResponse.json(  
        { error: 'Missing required fields: image, theme, or style.' },  
        { status: 400 }  
      );  
    }  

    const base64Data = image.split(',')[1];  
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;  

    const buildThemePrompt = (baseTheme: string) => {  
      const themePrompts: { [key: string]: string } = {  
        superhero:  
          'solo superhero wearing a superhero costume, dynamic action pose, empty city skyline background, dramatic lighting, cape flowing in the wind, superhero atmosphere',  
        knight:  
          'solo knight wearing medieval knight armor, holding a sword and shield, empty castle background, torches on stone walls, medieval fantasy setting',  
        'cartoon princess/prince':  
          'Animated cartoon style, royalty, castle background, illustrated cartoon, anime, cute, illustration, drawn features',  
        'minecraft character':  
          'Blocky, game-accurate style, cartoon, animated, playful colors',  
      };  

      const defaultPrompt =  
        'solo character in detailed themed environment, empty background scene, dynamic composition';  
      return themePrompts[baseTheme.toLowerCase()] || `${baseTheme}, ${defaultPrompt}`;  
    };  

    const themePrompt = isEdit  
      ? `solo portrait photo of the person, no other people, detailed background, ${customPrompt}, detailed environment`  
      : `solo portrait photo of the person, no other people, detailed background, ${buildThemePrompt(  
          theme  
        )}, ${style} style, detailed environment, high detail background`;  

    const headshotPrompt =  
      'solo portrait headshot of the person, plain neutral background, sharp focus, cinematic lighting, professional business headshot, ultra-detailed';  

    console.log('Generating theme image...');  
    const themeOutput = await replicate.run(  
      'zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789',  
      {  
        input: {  
          image: imageUrl,  
          prompt: themePrompt,  
          negative_prompt:  
            '(multiple people, crowd, group, background people, other people:1.8), (additional faces, extra people:1.8), (lowres, worst quality:1.2), (text:1.2), watermark, glitch, cross-eyed, ugly, NSFW content',  
          sdxl_weights: 'protovision-xl-high-fidel',  
          face_detection_input_width: 1024,  
          face_detection_input_height: 1024,  
          scheduler: 'EulerDiscreteScheduler',  
          num_inference_steps: 30,  
          guidance_scale: 5,  
          ip_adapter_scale: 0.8,  
          enable_lcm: true,  
          controlnet_conditioning_scale: 0.8,  
          enhance_nonface_region: true,  
          output_format: 'webp',  
          output_quality: 80,  
          seed: Math.floor(Math.random() * 1000000),  
        },  
      }  
    );  

    console.log('Generating headshot image...');  
    const headshotOutput = await replicate.run(  
      'zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789',  
      {  
        input: {  
          image: imageUrl,  
          prompt: headshotPrompt,  
          negative_prompt:  
            '(multiple people, crowd, group, background people, other people:1.8), (additional faces, extra people:1.8), (lowres, low quality, worst quality:1.2), (text:1.2), watermark, glitch, deformed, mutated, cross-eyed, ugly, disfigured',  
          sdxl_weights: 'protovision-xl-high-fidel',  
          face_detection_input_width: 1024,  
          face_detection_input_height: 1024,  
          scheduler: 'EulerDiscreteScheduler',  
          num_inference_steps: 30,  
          guidance_scale: 5,  
          ip_adapter_scale: 0.8,  
          controlnet_conditioning_scale: 0.8,  
          enhance_nonface_region: true,  
          output_format: 'webp',  
          output_quality: 80,  
          seed: Math.floor(Math.random() * 1000000),  
        },  
      }  
    );  

    const themeImage = Array.isArray(themeOutput) ? themeOutput[0] : themeOutput;  
    const headshotImage = Array.isArray(headshotOutput) ? headshotOutput[0] : headshotOutput;  

    if (!themeImage || !headshotImage) {  
      throw new Error('Failed to generate all required images.');  
    }  

    // Save images to Google Drive  
    try {  
      console.log('Starting Google Drive save process...');  
      
      // Download and save theme image  
      console.log('Processing theme image...');  
      const themeBuffer = await downloadImageToBuffer(themeImage);  
      const themeFileName = `theme_${Date.now()}.webp`;  
      console.log(`Saving theme image as: ${themeFileName}`);  
      const themeFileId = await saveImageToDrive(themeBuffer, themeFileName);  
      console.log(`Theme image saved with ID: ${themeFileId}`);  

      // Download and save headshot image  
      console.log('Processing headshot image...');  
      const headshotBuffer = await downloadImageToBuffer(headshotImage);  
      const headshotFileName = `headshot_${Date.now()}.webp`;  
      console.log(`Saving headshot image as: ${headshotFileName}`);  
      const headshotFileId = await saveImageToDrive(headshotBuffer, headshotFileName);  
      console.log(`Headshot image saved with ID: ${headshotFileId}`);  
    } catch (driveError) {  
      console.error('Failed to save to Google Drive:', driveError);  
      // Continue with the response even if Drive save fails  
    }  

    return NextResponse.json({  
      themeImage,  
      headshotImage,  
    });  
  } catch (error) {  
    console.error('Detailed error:', error);  
    console.error('Error stack:', (error as Error).stack);  
    return NextResponse.json(  
      { error: 'Failed to process image: ' + (error as Error).message },  
      { status: 500 }  
    );  
  }  
}