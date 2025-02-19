import { getStorage, ref, uploadBytes, getDownloadURL, uploadString, UploadResult } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../firebase';

export const uploadProfilePicture = async (file: File) => {
  console.group('Profile Picture Upload');
  console.time('uploadProfilePicture');
  
  try {
    // Detailed file validation
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (!file.type.startsWith('image/')) {
      console.warn('Invalid file type');
      throw new Error('Please upload an image file');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      console.warn('File too large');
      throw new Error('Image must be smaller than 5MB');
    }

    const storage = getStorage();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('No authenticated user');
      throw new Error('No authenticated user');
    }

    console.log('User ID:', currentUser.uid);

    // Create a unique filename with timestamp to prevent caching
    const filename = `profile-pictures/${currentUser.uid}_${Date.now()}.${file.name.split('.').pop()}`;

    // Create a reference for the profile picture with custom metadata
    const storageRef = ref(storage, filename);
    
    // Set metadata including CORS headers and custom metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploaded-by': currentUser.uid,
        'upload-time': new Date().toISOString(),
      },
      cacheControl: 'public, max-age=3600'
    };

    // Upload the file with enhanced error handling and metadata
    try {
      // Convert file to base64 for more reliable upload
      const reader = new FileReader();
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64String = (e.target?.result as string).split(',')[1];
            const snapshot = await uploadString(storageRef, base64String, 'base64', metadata);
            console.log('Upload successful with metadata:', snapshot.metadata);
            resolve(snapshot);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
      });
      
      reader.readAsDataURL(file);
      const snapshot = await uploadPromise;
      console.log('Upload snapshot:', snapshot);

      // Get the download URL
      const photoURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', photoURL);

      // Update user profile in Firebase Auth and reload
      if (currentUser) {
        await updateProfile(currentUser, { photoURL });
        await currentUser.reload(); // Force reload of user profile
      }

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { 
        photoURL,
        updatedAt: new Date() 
      });

      console.timeEnd('uploadProfilePicture');
      console.groupEnd();

      return photoURL;
    } catch (error: unknown) {
      const uploadError = error as { 
        code?: string, 
        message?: string, 
        name?: string 
      };

      console.error('Upload error details:', {
        name: uploadError.name,
        message: uploadError.message,
        code: uploadError.code
      });
      
      // Specific error handling for common Firebase upload issues
      if (uploadError.code === 'storage/unauthorized') {
        throw new Error('You are not authorized to upload this file.');
      }
      if (uploadError.code === 'storage/canceled') {
        throw new Error('File upload was canceled.');
      }
      if (uploadError.code === 'storage/unknown') {
        throw new Error('An unknown error occurred during upload.');
      }

      throw error;
    }
  } catch (error) {
    console.error('Profile picture upload error:', error);
    console.groupEnd();
    throw error;
  }
};

export const compressImage = async (file: File, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    // Create an off-screen image to process
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Release object URL
      URL.revokeObjectURL(img.src);
      
      // Calculate dimensions
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      // Create canvas for compression
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with quality control
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Image compression failed'));
          return;
        }
        
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        const endTime = performance.now();
        console.group('Image Compression');
        console.log('Compression Details:', {
          originalSize: file.size / 1024 + 'KB',
          compressedSize: compressedFile.size / 1024 + 'KB',
          compressionTime: (endTime - startTime).toFixed(2) + 'ms',
          compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%'
        });
        console.groupEnd();
        
        resolve(compressedFile);
      }, file.type, 0.7);
    };
    
    img.onerror = () => {
      reject(new Error('Image loading failed'));
    };
  });
};
