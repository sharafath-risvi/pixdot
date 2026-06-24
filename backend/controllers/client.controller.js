const Client = require("../models/Client");
const User = require("../models/User");
const CalendarEvent = require("../models/CalendarEvent");
const ClientService = require("../models/ClientService");
const Note = require("../models/Note");

/**
 * @route   GET /api/clients
 * @access  Private (admin, staff)
 * @desc    Get all clients
 */
const getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });

    // Attach portalUsername from linked User accounts
    const userIds = clients.map((c) => c.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("username _id");
    const usernameMap = {};
    users.forEach((u) => { usernameMap[u._id.toString()] = u.username; });

    const result = clients.map((c) => ({
      ...c.toObject(),
      portalUsername: usernameMap[c.userId?.toString()] ?? "",
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/clients/:id
 * @access  Private (admin, staff, client — own only)
 * @desc    Get a single client by ID
 */
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Client role can only access their own record
    if (req.user.role === "client" && req.user.clientId?.toString() !== id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const userAccount = await User.findById(client.userId).select("username");
    return res.status(200).json({
      success: true,
      data: { ...client.toObject(), portalUsername: userAccount?.username ?? "" },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/clients
 * @access  Private (admin only)
 * @desc    Create a new client + their User account
 */
const createClient = async (req, res, next) => {
  try {
    const {
      name, logo, businessType, gstNumber, phone, email, address,
      coreValues, totalAmount,
      portalUsername, portalPassword,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }
    if (!portalUsername || !portalUsername.trim()) {
      return res.status(400).json({ success: false, message: "Portal username is required." });
    }

    // Check username uniqueness
    const existingUser = await User.findOne({ username: portalUsername.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already taken." });
    }

    // Create login account
    const userAccount = await User.create({
      role: "client",
      username: portalUsername.trim().toLowerCase(),
      password: portalPassword?.trim() || "123456",
    });

    // Create client profile
    const client = await Client.create({
      userId: userAccount._id,
      name: name.trim(),
      logo: logo?.trim() || "",
      businessType: businessType?.trim() || "",
      gstNumber: gstNumber?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      address: address?.trim() || "",
      coreValues: coreValues?.trim() || "",

      totalAmount: Number(totalAmount) || 0,
    });

    return res.status(201).json({
      success: true,
      data: { ...client.toObject(), portalUsername: userAccount.username },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/clients/:id
 * @access  Private (admin only)
 * @desc    Update a client's profile
 */
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, logo, businessType, gstNumber, phone, email, address,
      coreValues, totalAmount, portalUsername, portalPassword,
    } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // Update profile fields
    if (name !== undefined) client.name = name.trim();
    if (logo !== undefined) client.logo = logo.trim();
    if (businessType !== undefined) client.businessType = businessType.trim();
    if (gstNumber !== undefined) client.gstNumber = gstNumber.trim();
    if (phone !== undefined) client.phone = phone.trim();
    if (email !== undefined) client.email = email.trim().toLowerCase();
    if (address !== undefined) client.address = address.trim();
    if (coreValues !== undefined) client.coreValues = coreValues.trim();

    if (totalAmount !== undefined) client.totalAmount = Number(totalAmount) || 0;

    await client.save();

    // Optionally update login credentials
    if (portalUsername?.trim() || portalPassword?.trim()) {
      const userAccount = await User.findById(client.userId);
      if (userAccount) {
        if (portalUsername?.trim()) {
          const existing = await User.findOne({ username: portalUsername.trim().toLowerCase(), _id: { $ne: client.userId } });
          if (existing) {
            return res.status(400).json({ success: false, message: "Username already taken." });
          }
          userAccount.username = portalUsername.trim().toLowerCase();
        }
        if (portalPassword?.trim()) {
          userAccount.password = portalPassword.trim(); // pre-save hook hashes
        }
        await userAccount.save();
      }
    }

    const userAccount = await User.findById(client.userId).select("username");
    return res.status(200).json({
      success: true,
      data: { ...client.toObject(), portalUsername: userAccount?.username ?? "" },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/clients/:id
 * @access  Private (admin only)
 * @desc    Delete a client and their User account
 */
const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // Delete login account
    await User.findByIdAndDelete(client.userId);
    // Delete associated data
    await CalendarEvent.deleteMany({ clientId: id });
    await ClientService.deleteMany({ client: id });
    await Note.deleteMany({ ownerId: id, ownerModel: "Client" });
    // Delete client profile
    await Client.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Client deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllClients, getClientById, createClient, updateClient, deleteClient };
