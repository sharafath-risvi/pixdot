const express = require("express");
const router = express.Router();
const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require("../controllers/client.controller");
const { protect, authorise } = require("../middleware/auth");

// GET /api/clients — admin + staff
router.get("/", protect, authorise("admin", "staff"), getAllClients);

// GET /api/clients/:id — admin, staff, client (own only)
router.get("/:id", protect, authorise("admin", "staff", "client"), getClientById);

// POST /api/clients — admin only
router.post("/", protect, authorise("admin"), createClient);

// PUT /api/clients/:id — admin only
router.put("/:id", protect, authorise("admin"), updateClient);

// DELETE /api/clients/:id — admin only
router.delete("/:id", protect, authorise("admin"), deleteClient);

module.exports = router;
