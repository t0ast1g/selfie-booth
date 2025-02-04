import { google } from 'googleapis';  
import { GoogleAuth } from 'google-auth-library';  
import { Readable } from 'stream';  

// Define error interface  
interface GoogleDriveError {  
  response?: {  
    data: any;  
  };  
  message: string;  
}  

// Initialize auth client  
const auth = new GoogleAuth({  
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,  
  scopes: ['https://www.googleapis.com/auth/drive.file'],  
});  

// Initialize drive client with auth  
const drive = google.drive({  
  version: 'v3',  
  auth: auth  
});  

// Helper function to convert Buffer to Readable Stream  
function bufferToStream(buffer: Buffer) {  
  const stream = new Readable();  
  stream.push(buffer);  
  stream.push(null);  
  return stream;  
}  

export async function saveImageToDrive(imageBuffer: Buffer, fileName: string) {  
  try {  
    console.log('Starting Drive save operation...');  
    console.log('Using folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);  
    
    const fileMetadata = {  
      name: fileName,  
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!]  
    };  

    const media = {  
      mimeType: 'image/webp',  
      body: bufferToStream(imageBuffer)  
    };  

    const response = await drive.files.create({  
      requestBody: fileMetadata,  
      media: media,  
      fields: 'id'  
    });  

    console.log('File created successfully with ID:', response.data.id);  
    return response.data.id;  
  } catch (error: unknown) {  
    console.error('Detailed error saving to Google Drive:', error);  
    
    // Type guard to check if error is our expected type  
    if (error && typeof error === 'object' && 'response' in error) {  
      const driveError = error as GoogleDriveError;  
      if (driveError.response) {  
        console.error('Error response:', driveError.response.data);  
      }  
    }  
    
    throw error;  
  }  
}  

export async function testDriveSetup() {  
  try {  
    console.log('Testing Drive setup...');  
    console.log('Credentials path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);  
    console.log('Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);  

    const response = await drive.files.list({  
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,  
      fields: 'files(id, name)',  
      pageSize: 1,  
    });  

    console.log('Successfully connected to Drive');  
    return true;  
  } catch (error: unknown) {  
    console.error('Drive setup test failed:', error);  
    if (error && typeof error === 'object' && 'message' in error) {  
      console.error('Error message:', (error as { message: string }).message);  
    }  
    throw error;  
  }  
}