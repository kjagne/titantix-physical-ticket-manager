
// This is a FRONTEND SIMULATION of secure token generation.
// In a real-world scenario, the signing key would be on a secure server.
const MOCK_SECRET_KEY = "a-very-secret-key-for-titan-tix-demo";

// Basic Base64 encoding for the payload part of the token
const base64Encode = (str: string): string => {
  try {
    return btoa(str);
  } catch (e) {
    console.error("Failed to base64 encode:", e);
    return "";
  }
};

// A simple (and insecure) hash function to simulate a signature
const simpleHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateRandomChars = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const generateSerial = (typePrefix: string): string => {
  const prefix = typePrefix.substring(0, 3).toUpperCase().padEnd(3, 'X');
  const part1 = generateRandomChars(4);
  const part2 = generateRandomChars(4);
  const part3 = generateRandomChars(4);
  return `${prefix}-${part1}-${part2}-${part3}`;
};


export const generateSignedToken = async (serial: string): Promise<string> => {
  const payload = {
    s: serial,
    iat: Date.now(),
  };
  const encodedPayload = base64Encode(JSON.stringify(payload));
  const signatureInput = `${encodedPayload}.${MOCK_SECRET_KEY}`;
  const signature = await simpleHash(signatureInput);
  
  return `${encodedPayload}.${signature}`;
};

export const verifyToken = async (token: string): Promise<boolean> => {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  const [encodedPayload, signature] = parts;
  const signatureInput = `${encodedPayload}.${MOCK_SECRET_KEY}`;
  const expectedSignature = await simpleHash(signatureInput);

  return signature === expectedSignature;
};
