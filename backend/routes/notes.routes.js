const express = require("express");
const router = express.Router();
const { getNotes, createNote, updateNote, deleteNote } = require("../controllers/notes.controller");
const { protect, authorise } = require("../middleware/auth");

// All note routes are for staff and client only (not admin — admin doesn't have notes)
router.get("/", protect, authorise("staff", "client"), getNotes);
router.post("/", protect, authorise("staff", "client"), createNote);
router.put("/:id", protect, authorise("staff", "client"), updateNote);
router.delete("/:id", protect, authorise("staff", "client"), deleteNote);

module.exports = router;
