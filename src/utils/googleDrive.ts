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

// Initialize auth client using credentials from environment variable  
const auth = new GoogleAuth({  
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ?   
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) :   
    undefined,  
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

// Verify environment variables  
function verifyEnvironmentVariables() {  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {  
    throw new Error('Google credentials not configured');  
  }  

  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {  
    throw new Error('Google Drive folder ID not configured');  
  }  

  try {  
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);  
  } catch (error) {  
    throw new Error('Invalid Google credentials JSON format');  
  }  
}  

export async function saveImageToDrive(imageBuffer: Buffer, fileName: string) {  
  try {  
    verifyEnvironmentVariables();  
    
    console.log('Starting Drive save operation...');  
    console.log('Using folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);  
    console.log('Credentials available:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS);  
    
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
    verifyEnvironmentVariables();  
    
    console.log('Testing Drive setup...');  
    console.log('Credentials available:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS);  
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

// Optional: Export function to get credentials status  
export function getDriveStatus() {  
  return {  
    hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,  
    hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,  
    isCredentialsValid: (() => {  
      try {  
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) return false;  
        JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);  
        return true;  
      } catch {  
        return false;  
      }  
    })()  
  };  
}