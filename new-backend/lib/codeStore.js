// Simple in-memory store for verification codes
const codes = new Map();

// Save code with 10 minute expiration
function saveCode(email, code) {
  codes.set(email, {
    code,
    expiry: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
}

// Verify and consume code
function verifyCode(email, code) {
  const stored = codes.get(email);
  
  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiry) {
    codes.delete(email);
    return false;
  }

  if (stored.code !== code) {
    return false;
  }

  // Code is valid - consume it
  codes.delete(email);
  return true;
}

module.exports = {
  saveCode,
  verifyCode
};
