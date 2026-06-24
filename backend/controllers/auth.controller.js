const User = require("../models/User");
const Client = require("../models/Client");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");

/**
 * @route   POST /api/auth/login
 * @access  Public
 * @desc    Login for admin, staff, and client
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    // Find user (password is excluded by default, use +password)
    const user = await User.findOne({ username: username.trim().toLowerCase() }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    // Build token payload
    const tokenPayload = { userId: user._id, role: user.role };

    let profileId = null;
    let dashboard = "/";

    if (user.role === "admin") {
      dashboard = "/admin-dashboard";
    } else if (user.role === "staff") {
      const staffRecord = await Staff.findOne({ userId: user._id }).select("_id");
      profileId = staffRecord?._id ?? null;
      tokenPayload.staffId = profileId;
      dashboard = "/staff/clients";
    } else if (user.role === "client") {
      const clientRecord = await Client.findOne({ userId: user._id }).select("_id");
      profileId = clientRecord?._id ?? null;
      tokenPayload.clientId = profileId;
      dashboard = "/client/dashboard";
    }

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      data: {
        token,
        role: user.role,
        userId: user._id,
        staffId: tokenPayload.staffId ?? null,
        clientId: tokenPayload.clientId ?? null,
        dashboard,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/auth/me
 * @access  Private (all roles)
 * @desc    Returns current authenticated user info
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let profile = null;
    if (user.role === "staff") {
      profile = await Staff.findOne({ userId: user._id });
    } else if (user.role === "client") {
      profile = await Client.findOne({ userId: user._id });
    }

    return res.status(200).json({
      success: true,
      data: { user, profile },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/auth/change-password/:userId
 * @access  Private (admin only)
 * @desc    Admin changes any user's password
 */
const changeUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/auth/change-my-password
 * @access  Private (admin only — admin changes own password)
 * @desc    Admin verifies current password then sets new one
 */
const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, changeUserPassword, changeMyPassword };
