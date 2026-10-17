// Exact HTML5 format: base64(12-byte IV || AES-GCM ciphertext including its auth tag).
// https://docs.crazygames.com/sdk/leaderboards-client/
export function decodeEncryptionKey(encryptionKey) {
  const bytes = Uint8Array.from(atob(encryptionKey), (character) => character.charCodeAt(0));
  if (bytes.length !== 32) throw new Error('The client encryption key must decode to 32 bytes.');
  return bytes;
}
export default async function encryptScore(score, encryptionKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const algorithm = { name: 'AES-GCM', iv };
  const cryptoKey = await window.crypto.subtle.importKey('raw', decodeEncryptionKey(encryptionKey), algorithm, false, ['encrypt']);
  const plaintext = new TextEncoder().encode(score.toString());
  const encrypted = await window.crypto.subtle.encrypt(algorithm, cryptoKey, plaintext);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}