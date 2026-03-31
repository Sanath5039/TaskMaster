const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a 6-digit numeric OTP
 * @returns {string}
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash an OTP for secure storage
 * @param {string} otp 
 * @returns {Promise<string>}
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/**
 * Verify an OTP against its hashed version
 * @param {string} otp 
 * @param {string} hashedOtp 
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (otp, hashedOtp) => {
  if (!otp || !hashedOtp) return false;
  return await bcrypt.compare(otp, hashedOtp);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};
