/**
 * End-to-End Encryption Utilities
 * Uses Web Crypto API (AES-GCM) for client-side encryption.
 */

const ENCRYPTION_ALGORITHM = "AES-GCM";

/**
 * Derives a cryptographic key from a shared secret string (e.g., room name)
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  
  // Hash the secret to ensure it's a fixed length suitable for key derivation
  const hash = await crypto.subtle.digest("SHA-256", data);
  
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: ENCRYPTION_ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using a shared secret
 */
export async function encryptMessage(text: string, secret: string): Promise<string> {
  try {
    const key = await deriveKey(secret);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV and encrypted data into a single Base64 string
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
}

/**
 * Decrypts a Base64 encoded string using a shared secret
 */
export async function decryptMessage(encryptedBase64: string, secret: string): Promise<string> {
  try {
    const key = await deriveKey(secret);
    const combinedData = new Uint8Array(
      atob(encryptedBase64)
        .split("")
        .map((char) => char.charCodeAt(0))
    );
    
    const iv = combinedData.slice(0, 12);
    const encryptedData = combinedData.slice(12);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.warn("Decryption failed (possibly wrong key or malformed data):", error);
    return "[Encrypted Message - Unreadable]";
  }
}
