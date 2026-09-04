/**
 * Client-Side Cryptographic Utilities for Time-Locked Capsules
 * Employs standard W3C Web Cryptography API (AES-GCM 256-bit).
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypts cleartext with AES-GCM using a generated 256-bit key.
 */
export async function encryptCapsulePayload(
  cleartext: string
): Promise<{ ciphertext: string; iv: string; key: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(cleartext);

  // Generate 256-bit AES-GCM key
  const keyObj = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  // 12-byte initialization vector for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    keyObj,
    data
  );

  // Export raw key
  const rawKey = await window.crypto.subtle.exportKey('raw', keyObj);
  const keyHex = uint8ArrayToHex(new Uint8Array(rawKey));

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: uint8ArrayToHex(iv),
    key: keyHex,
  };
}

/**
 * Decrypts AES-GCM ciphertext using the released secret key.
 */
export async function decryptCapsulePayload(
  ciphertextBase64: string,
  ivHex: string,
  keyHex: string
): Promise<string> {
  const rawKeyBytes = hexToUint8Array(keyHex);
  const ivBytes = hexToUint8Array(ivHex);
  const cipherBuffer = base64ToArrayBuffer(ciphertextBase64);

  const keyObj = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    keyObj,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
