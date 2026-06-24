const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT token.
 * @param {Object} payload - { userId, role, clientId?, staffId? }
 * @returns {string} Signed JWT string
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
