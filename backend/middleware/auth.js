const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifies JWT from Authorization: Bearer <token> header.
 * Attaches req.user = { userId, role, clientId, staffId } on success.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorised, no token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded payload to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Not authorised, token invalid or expired." });
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: authorise("admin"), authorise("admin", "staff")
 */
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorise };
