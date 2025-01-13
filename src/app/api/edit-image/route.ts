import { NextResponse } from 'next/server';  
import { replicate } from '@/lib/replicate';  

export async function POST(request: Request) {  
  try {  
    const { image, prompt } = await request.json();  

    if (!image) {  
      throw new Error('No image provided');  
    }  

    let processedImage = image;  
    if (image.startsWith('data:image')) {  
      processedImage = image.split(',')[1];  
    }

    const maxDimension = 768;
    
    const output = await replicate.run(  
      "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",  
      {  
        input: {  
          image: processedImage,  
          prompt: `${prompt}`,  
          negative_prompt: "blur, contrast changes, NSFW content, lighting changes, color shifts, style changes, deformed, distorted, hair changes, changes to facial features",  
          
          // Updated parameters with exact values provided
          num_outputs: 1,                    // Number of images to output
          num_inference_steps: 100,          // Higher quality with more steps
          guidance_scale: 7.5,               // Default classifier-free guidance scale
          image_guidance_scale: 1.5,         // Push generated image towards initial image
          scheduler: "K_EULER_ANCESTRAL",    // Default scheduler
          
          // Maintaining other necessary parameters
          width: maxDimension,
          height: maxDimension,
          seed: 42
        }  
      }  
    );  

    const processedImageUrl = Array.isArray(output) ? output[0] : output;  

    if (!processedImageUrl) {  
      throw new Error('No output received from image edit');  
    }  

    return NextResponse.json({ processedImage: processedImageUrl });  
  } catch (error) {  
    console.error('Image editing error:', error);  
    return NextResponse.json(  
      { error: 'Failed to edit image: ' + (error as Error).message },  
      { status: 500 }  
    );  
  }  
}