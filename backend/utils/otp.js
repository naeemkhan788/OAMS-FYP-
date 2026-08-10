const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * OTP utility functions for generating, hashing, and validating OTPs
 */

/**
 * Generate a 6-digit random OTP
 * @returns {string} - 6-digit numeric OTP
 */
const generateOTP = () => {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Hash OTP for secure storage
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} - Hashed OTP
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/**
 * Verify OTP against hashed value
 * @param {string} plainOTP - Plain text OTP from user input
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} - Match status
 */
const verifyOTP = async (plainOTP, hashedOTP) => {
  return await bcrypt.compare(plainOTP, hashedOTP);
};

/**
 * Check if OTP has expired
 * @param {Date} expireTime - OTP expiration timestamp
 * @returns {boolean} - True if expired, false if valid
 */
const isOTPExpired = (expireTime) => {
  if (!expireTime) return true;
  return new Date() > new Date(expireTime);
};

/**
 * Calculate OTP expiration time (10 minutes from now)
 * @returns {Date} - Expiration timestamp
 */
const getOTPExpiration = () => {
  const now = new Date();
  const expiration = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
  return expiration;
};

/**
 * Check if user can request new OTP (rate limiting: 1 request per 60 seconds)
 * @param {Date} lastSentAt - Last OTP sent timestamp
 * @returns {boolean} - True if can request, false if rate limited
 */
const canRequestOTP = (lastSentAt) => {
  if (!lastSentAt) return true;
  const now = new Date();
  const lastSent = new Date(lastSentAt);
  const timeDiff = now - lastSent;
  return timeDiff >= 60 * 1000; // 60 seconds
};

/**
 * Check if user has exceeded OTP attempt limit (max 5 attempts)
 * @param {number} attempts - Current attempt count
 * @returns {boolean} - True if can attempt, false if limit exceeded
 */
const canAttemptOTP = (attempts) => {
  return attempts < 5;
};

/**
 * Clear OTP fields from user object
 * @param {Object} user - User object
 * @returns {Object} - Updated user object
 */
const clearOTPFields = (user) => {
  user.emailOTP = undefined;
  user.emailOTPExpire = undefined;
  user.otpAttempts = 0;
  user.lastOTPSentAt = undefined;
  return user;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  isOTPExpired,
  getOTPExpiration,
  canRequestOTP,
  canAttemptOTP,
  clearOTPFields
};
