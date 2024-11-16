/**
 * Generates a random 6-digit OTP
 * @returns {string} A random 6-digit OTP as a string
 */
exports.generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};
