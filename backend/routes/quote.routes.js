const express = require("express");
const router = express.Router();
const { createQuoteRequest } = require("../controllers/quote.controller");

// Public route to submit quotes
router.post("/", createQuoteRequest);

module.exports = router;
