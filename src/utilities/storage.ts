import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
  try {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `profile-photos/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload photo');
  }
};
