const express = require("express");
const router = express.Router();
const contentTypesController = require("../controllers/contentTypes.controller");
const { protect } = require("../middleware/auth");

router.get("/", protect, contentTypesController.getContentTypes);
router.post("/", protect, contentTypesController.addContentType);

module.exports = router;
