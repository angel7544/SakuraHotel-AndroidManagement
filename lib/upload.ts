import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';

// Credentials (ideally from env, but hardcoded for this context as requested)
const CLOUD_NAME = "doalguvvw";
const API_KEY = "476279815511533";
const API_SECRET = "bvyKbwpNt1_TnSsft1ago65lNAk";

export const uploadImage = async (uri: string, bucket: string = 'sakura', folder: string = 'uploads') => {
  try {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = CryptoJS.SHA1(signatureString).toString();

    const formData = new FormData();
    
    // We need to pass the file as an object with uri, type, and name
    const fileType = uri.substring(uri.lastIndexOf('.') + 1);
    formData.append('file', {
      uri: uri,
      type: `image/${fileType}`,
      name: `upload.${fileType}`,
    } as any);
    
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary upload error:', data);
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
