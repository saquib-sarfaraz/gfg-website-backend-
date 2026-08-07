const crypto = require('crypto');

/**
 * Generates a unique, non-sequential, cryptographically secure platform userCode.
 * Format: GFGJH-U-XXXXXX (6 alphanumeric uppercase chars)
 * Example: GFGJH-U-8K4P2M
 */
const generateUserCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous uppercase chars
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `GFGJH-U-${code}`;
};

module.exports = {
  generateUserCode
};
