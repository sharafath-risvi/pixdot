const express = require("express");
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/staff.controller");
const { protect, authorise } = require("../middleware/auth");

// GET /api/staff — admin only
router.get("/", protect, authorise("admin"), getAllStaff);

// GET /api/staff/:id — admin + staff (own only — enforced in controller)
router.get("/:id", protect, authorise("admin", "staff"), getStaffById);

// POST /api/staff — admin only
router.post("/", protect, authorise("admin"), createStaff);

// PUT /api/staff/:id — admin (full) + staff (own phone/image only — enforced in controller)
router.put("/:id", protect, authorise("admin", "staff"), updateStaff);

// DELETE /api/staff/:id — admin only
router.delete("/:id", protect, authorise("admin"), deleteStaff);

module.exports = router;
