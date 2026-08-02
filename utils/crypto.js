// Cryptographic utilities for local database encryption using the Web Crypto API.
// Implements PBKDF2 key derivation and AES-GCM-256 encryption.

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256; // bits

/**
 * ArrayBuffer/Uint8Array to Base64
 */
function uint8ToBase64(uint8) {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

/**
 * Base64 to Uint8Array
 */
function base64ToUint8(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive encryption key from password via PBKDF2
 */
async function deriveKey(password, salt) {
  const textEncoder = new TextEncoder();
  const rawKey = await window.crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    rawKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using a password
 * @param {string} plainText
 * @param {string} password
 * @returns {Promise<{ v: number, salt: string, iv: string, ciphertext: string }>}
 */
export async function encryptData(plainText, password) {
  const textEncoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    textEncoder.encode(plainText)
  );

  return {
    v: 1, // version
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv),
    ciphertext: uint8ToBase64(new Uint8Array(encryptedBuffer)),
  };
}

/**
 * Decrypts an encrypted payload object using a password
 * @param {{ salt: string, iv: string, ciphertext: string }} encryptedObj
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function decryptData(encryptedObj, password) {
  if (!encryptedObj.salt || !encryptedObj.iv || !encryptedObj.ciphertext) {
    throw new Error('Ungültiges verschlüsseltes Datenformat');
  }

  const salt = base64ToUint8(encryptedObj.salt);
  const iv = base64ToUint8(encryptedObj.iv);
  const ciphertext = base64ToUint8(encryptedObj.ciphertext);

  const key = await deriveKey(password, salt);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  const textDecoder = new TextDecoder();
  return textDecoder.decode(decryptedBuffer);
}
