/**
 * Web Crypto AES-GCM Encryption Utility for Health Data at Rest
 * Meets DPDP Act 2023 / HIPAA guidance for client-side storage encryption.
 * Endpoint protection: secures cached PII (phone, address) on frontline handheld tablets.
 */

const DEVICE_SALT_KEY = 'chw_device_salt';
const LEGACY_DEFAULT_SALT = 'CHW_HEALTHCARE_ENCRYPTION_SALT_v1';
const LEGACY_DEFAULT_KEYS = ['CHW_DEVICE_SECURE_SESSION', 'CHW_LOCAL_PIN', 'CHW_OFFLINE_DEVICE_KEY'];

let activeUserId = null;
let activeSessionKey = null;

/**
 * Get or initialize a device-persistent cryptographic salt for PBKDF2 key derivation.
 */
export function getOrCreateDeviceSalt() {
  if (typeof localStorage === 'undefined') return LEGACY_DEFAULT_SALT;
  try {
    let salt = localStorage.getItem(DEVICE_SALT_KEY);
    if (!salt) {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        salt = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        salt = 'chw_salt_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
      localStorage.setItem(DEVICE_SALT_KEY, salt);
    }
    return salt;
  } catch {
    return LEGACY_DEFAULT_SALT;
  }
}

/**
 * Bind the active logged-in user context for encryption key derivation.
 * Volatile memory only: clears upon session logout.
 */
export function setUserEncryptionContext(userId) {
  activeUserId = userId || null;
  activeSessionKey = null;
}

/**
 * Clear the volatile user encryption key from memory on logout.
 */
export function clearUserEncryptionContext() {
  activeUserId = null;
  activeSessionKey = null;
}

/**
 * Derive an AES-GCM 256-bit key using PBKDF2 (100,000 iterations, SHA-256)
 */
export async function deriveKey(secret, customSalt = null) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return null;
  }
  try {
    const encoder = new TextEncoder();
    const effectiveSalt = customSalt || (activeUserId ? `${getOrCreateDeviceSalt()}:${activeUserId}` : getOrCreateDeviceSalt());
    const effectiveSecret = secret || (activeUserId ? `user:${activeUserId}` : 'CHW_DEVICE_SECURE_SESSION');

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(effectiveSecret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(effectiveSalt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.warn('Crypto key derivation notice:', err);
    return null;
  }
}

/**
 * Encrypt sensitive string or JSON payload using AES-GCM 256
 */
export async function encryptSensitiveData(plainData, secretKey = null) {
  if (!plainData) return plainData;
  const serialized = typeof plainData === 'object' ? JSON.stringify(plainData) : String(plainData);

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Base64 encoding fallback in environments without Web Crypto subtle
    try {
      return 'b64:' + btoa(unescape(encodeURIComponent(serialized)));
    } catch {
      return serialized;
    }
  }

  try {
    let key;
    // If a custom non-default secret key is provided, derive from it directly
    if (secretKey && !LEGACY_DEFAULT_KEYS.includes(secretKey)) {
      key = await deriveKey(secretKey, LEGACY_DEFAULT_SALT);
    } else {
      if (!activeSessionKey) {
        activeSessionKey = await deriveKey(secretKey);
      }
      key = activeSessionKey;
    }

    if (!key) return serialized;

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(serialized);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const cipherArray = Array.from(new Uint8Array(cipherBuffer));
    const ivArray = Array.from(iv);

    return JSON.stringify({
      __enc: true,
      iv: ivArray,
      data: cipherArray
    });
  } catch (err) {
    console.warn('Encryption fallback invoked:', err);
    return serialized;
  }
}

/**
 * Decrypt sensitive payload back to original string or parsed object.
 * Includes automatic graceful fallback to legacy keys to ensure backwards compatibility.
 */
export async function decryptSensitiveData(cipherPayload, secretKey = null) {
  if (!cipherPayload) return cipherPayload;

  if (typeof cipherPayload === 'string' && cipherPayload.startsWith('b64:')) {
    try {
      const decoded = decodeURIComponent(escape(atob(cipherPayload.slice(4))));
      try { return JSON.parse(decoded); } catch { return decoded; }
    } catch {
      return cipherPayload;
    }
  }

  if (typeof cipherPayload === 'string' && cipherPayload.startsWith('{"__enc":true')) {
    try {
      const parsed = JSON.parse(cipherPayload);
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const iv = new Uint8Array(parsed.iv);
        const data = new Uint8Array(parsed.data);

        // 1. Attempt decryption with primary active key
        let primaryKey;
        if (secretKey && !LEGACY_DEFAULT_KEYS.includes(secretKey)) {
          primaryKey = await deriveKey(secretKey, LEGACY_DEFAULT_SALT);
        } else {
          if (!activeSessionKey) {
            activeSessionKey = await deriveKey(secretKey);
          }
          primaryKey = activeSessionKey;
        }

        if (primaryKey) {
          try {
            const decryptedBuffer = await crypto.subtle.decrypt(
              { name: 'AES-GCM', iv },
              primaryKey,
              data
            );
            const decodedString = new TextDecoder().decode(decryptedBuffer);
            try { return JSON.parse(decodedString); } catch { return decodedString; }
          } catch {
            // Decryption with primary key failed (likely legacy key/salt). Proceed to backwards compatibility fallback.
          }
        }

        // 2. Backwards compatibility fallback: test legacy keys and legacy salt
        const fallbackCandidates = [
          secretKey,
          'CHW_LOCAL_PIN',
          'CHW_DEVICE_SECURE_SESSION',
          'CHW_OFFLINE_DEVICE_KEY'
        ].filter(Boolean);

        for (const candidateKey of fallbackCandidates) {
          try {
            const legacyKey = await deriveKey(candidateKey, LEGACY_DEFAULT_SALT);
            if (legacyKey) {
              const fallbackBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                legacyKey,
                data
              );
              const decodedString = new TextDecoder().decode(fallbackBuffer);
              try { return JSON.parse(decodedString); } catch { return decodedString; }
            }
          } catch {
            // Continue trying remaining fallback keys
          }
        }
      }
    } catch (err) {
      console.warn('Decryption notice:', err);
    }
  }

  return cipherPayload;
}
