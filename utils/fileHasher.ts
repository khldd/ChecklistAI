import CryptoJS from 'crypto-js';

/**
 * Generates MD5 hash of a file for duplicate detection
 * @param file - The file to hash
 * @returns Promise<string> - The MD5 hash string
 */
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const wordArray = CryptoJS.lib.WordArray.create(
          event.target.result as ArrayBuffer
        );
        const hash = CryptoJS.MD5(wordArray).toString();
        resolve(hash);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates SHA-256 hash of a file for additional security
 * @param file - The file to hash
 * @returns Promise<string> - The SHA-256 hash string
 */
export async function generateFileHashSHA256(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const wordArray = CryptoJS.lib.WordArray.create(
          event.target.result as ArrayBuffer
        );
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
