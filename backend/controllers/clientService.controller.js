const ClientService = require("../models/ClientService");
const Client = require("../models/Client");
const Staff = require("../models/Staff");

/**
 * @route   GET /api/services
 * @access  Private (admin, staff, client)
 * @desc    Get services based on role
 */
const getServices = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    let filter = {};
    if (role === "client") {
      filter.client = req.user.clientId;
    } else if (role === "staff") {
      // In this app, staff might have access to all clients or specific clients.
      // If there's no staff-to-client assignment logic, staff sees all active services or just services for their workspace.
      // We will fetch all services but staff will only use this to view services for clients they can access.
    }

    const services = await ClientService.find(filter)
      .populate("client", "name logo")
      .populate("assignedBy", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/services/:id
 * @access  Private
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await ClientService.findById(req.params.id)
      .populate("client", "name")
      .populate("assignedBy", "username");

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    if (req.user.role === "client" && service.client._id.toString() !== req.user.clientId?.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/services
 * @access  Private (admin)
 */
const createService = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can assign services." });
    }

    const { clientId, serviceName, category, description, status, price, startDate, endDate } = req.body;

    if (!clientId || !serviceName) {
      return res.status(400).json({ success: false, message: "Client ID and Service Name are required." });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const newService = await ClientService.create({
      client: clientId,
      serviceName,
      category,
      description,
      status: status || "Active",
      price: price || 0,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      assignedBy: req.user._id,
    });

    const populated = await ClientService.findById(newService._id)
      .populate("client", "name logo")
      .populate("assignedBy", "username");

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/services/:id
 * @access  Private (admin)
 */
const updateService = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can update services." });
    }

    const service = await ClientService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    const { serviceName, category, description, status, price, startDate, endDate } = req.body;

    if (serviceName !== undefined) service.serviceName = serviceName;
    if (category !== undefined) service.category = category;
    if (description !== undefined) service.description = description;
    if (status !== undefined) service.status = status;
    if (price !== undefined) service.price = price;
    if (startDate !== undefined) service.startDate = startDate;
    if (endDate !== undefined) service.endDate = endDate;

    await service.save();

    const populated = await ClientService.findById(service._id)
      .populate("client", "name logo")
      .populate("assignedBy", "username");

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/services/:id
 * @access  Private (admin)
 */
const deleteService = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can delete services." });
    }

    const service = await ClientService.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.status(200).json({ success: true, message: "Service deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
