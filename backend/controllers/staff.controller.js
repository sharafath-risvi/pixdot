const Staff = require("../models/Staff");
const User = require("../models/User");
const Note = require("../models/Note");

/**
 * @route   GET /api/staff
 * @access  Private (admin only)
 * @desc    Get all staff members
 */
const getAllStaff = async (req, res, next) => {
  try {
    const staffList = await Staff.find().sort({ createdAt: -1 });

    const userIds = staffList.map((s) => s.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("username _id");
    const usernameMap = {};
    users.forEach((u) => { usernameMap[u._id.toString()] = u.username; });

    const result = staffList.map((s) => ({
      ...s.toObject(),
      username: usernameMap[s.userId?.toString()] ?? "",
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/staff/:id
 * @access  Private (admin, staff — own only)
 * @desc    Get a single staff member by ID
 */
const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Staff role can only access their own record
    if (req.user.role === "staff" && req.user.staffId?.toString() !== id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    const userAccount = await User.findById(staff.userId).select("username");

    // Fetch salary visibility setting
    const Setting = require("../models/Setting");
    const salarySetting = await Setting.findOne({ key: "staffSalaryVisibleToSelf" });
    const salaryVisible = salarySetting?.value ?? true;

    const data = {
      ...staff.toObject(),
      username: userAccount?.username ?? "",
    };

    // Staff viewing own profile: hide salary if setting is off
    if (req.user.role === "staff" && !salaryVisible) {
      data.salary = undefined;
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/staff
 * @access  Private (admin only)
 * @desc    Create a new staff member + their User account
 */
const createStaff = async (req, res, next) => {
  try {
    const { name, role, salary, phone, email, profileImage, username, password } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Staff name is required." });
    }
    if (!username?.trim()) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }

    // Check username uniqueness
    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already taken." });
    }

    // Create login account
    const userAccount = await User.create({
      role: "staff",
      username: username.trim().toLowerCase(),
      password: password?.trim() || "123456",
    });

    // Create staff profile
    const staff = await Staff.create({
      userId: userAccount._id,
      name: name.trim(),
      role: role?.trim() || "",
      salary: salary?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      profileImage: profileImage?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      data: { ...staff.toObject(), username: userAccount.username },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/staff/:id
 * @access  Private (admin — full; staff — own phone + profileImage only)
 * @desc    Update staff profile
 */
const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Staff can only update own profile
    if (req.user.role === "staff" && req.user.staffId?.toString() !== id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    const {
      name, role, salary, phone, email, profileImage,
      username, password,
    } = req.body;

    if (req.user.role === "admin") {
      // Admin can update everything
      if (name !== undefined) staff.name = name.trim();
      if (role !== undefined) staff.role = role.trim();
      if (salary !== undefined) staff.salary = salary.trim();
      if (email !== undefined) staff.email = email.trim().toLowerCase();

      // Update credentials
      if (username?.trim() || password?.trim()) {
        const userAccount = await User.findById(staff.userId);
        if (userAccount) {
          if (username?.trim()) {
            const existing = await User.findOne({ username: username.trim().toLowerCase(), _id: { $ne: staff.userId } });
            if (existing) {
              return res.status(400).json({ success: false, message: "Username already taken." });
            }
            userAccount.username = username.trim().toLowerCase();
          }
          if (password?.trim()) {
            userAccount.password = password.trim(); // pre-save hook hashes
          }
          await userAccount.save();
        }
      }
    }

    // Both admin and staff can update phone + profileImage
    if (phone !== undefined) staff.phone = phone.trim();
    if (profileImage !== undefined) staff.profileImage = profileImage.trim();

    await staff.save();

    const userAccount = await User.findById(staff.userId).select("username");
    return res.status(200).json({
      success: true,
      data: { ...staff.toObject(), username: userAccount?.username ?? "" },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/staff/:id
 * @access  Private (admin only)
 * @desc    Delete a staff member and their User account
 */
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    await Note.deleteMany({ ownerId: id, ownerModel: "Staff" });
    await User.findByIdAndDelete(staff.userId);
    await Staff.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Staff member deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff };
