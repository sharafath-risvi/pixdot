const express = require("express");
const router = express.Router();
const { protect, authorise } = require("../middleware/auth");
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/clientService.controller");

router.use(protect);

router.route("/")
  .get(getServices)
  .post(authorise("admin"), createService);

router.route("/:id")
  .get(getServiceById)
  .put(authorise("admin", "staff"), updateService)
  .delete(authorise("admin"), deleteService);

module.exports = router;
