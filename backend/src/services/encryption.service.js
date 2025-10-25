const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Mã hóa file buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Object} - { encryptedData: Buffer, iv: Buffer, authTag: Buffer }
 */
function encryptFile(buffer) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv,
    authTag,
  };
}

/**
 * Giải mã file
 * @param {Buffer} encryptedData
 * @param {Buffer} iv
 * @param {Buffer} authTag
 * @returns {Buffer} - Decrypted file buffer
 */
function decryptFile(encryptedData, iv, authTag) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Tạo tên file encrypted unique
 * @param {String} originalFilename
 * @returns {String}
 */
function generateEncryptedFilename(originalFilename) {
  const ext = originalFilename.split(".").pop();
  const randomName = crypto.randomBytes(16).toString("hex");
  return `${randomName}.${ext}.enc`;
}

module.exports = {
  encryptFile,
  decryptFile,
  generateEncryptedFilename,
};
