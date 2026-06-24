const Note = require("../models/Note");
const Staff = require("../models/Staff");
const Client = require("../models/Client");

/**
 * Resolves the owner record and model name for the current user.
 */
async function resolveOwner(user) {
  if (user.role === "staff") {
    const staff = await Staff.findById(user.staffId).select("_id");
    if (!staff) return null;
    return { ownerId: staff._id, ownerType: "staff", ownerModel: "Staff" };
  }
  if (user.role === "client") {
    const client = await Client.findById(user.clientId).select("_id");
    if (!client) return null;
    return { ownerId: client._id, ownerType: "client", ownerModel: "Client" };
  }
  return null;
}

/**
 * @route   GET /api/notes
 * @access  Private (staff, client — own notes only)
 * @desc    Get all notes for the current user
 */
const getNotes = async (req, res, next) => {
  try {
    const owner = await resolveOwner(req.user);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    const notes = await Note.find({ ownerId: owner.ownerId, ownerType: owner.ownerType })
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/notes
 * @access  Private (staff, client)
 * @desc    Create a new note
 */
const createNote = async (req, res, next) => {
  try {
    const owner = await resolveOwner(req.user);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    const { title, description, date, type } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Note title is required." });
    }
    const validTypes = ["Daily", "Weekly", "Monthly", "Yearly"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Note type must be Daily, Weekly, Monthly, or Yearly." });
    }

    const note = await Note.create({
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      ownerModel: owner.ownerModel,
      title: title.trim(),
      description: description?.trim() || "",
      date: date || "",
      type,
    });

    return res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/notes/:id
 * @access  Private (staff, client — own only)
 * @desc    Update a note
 */
const updateNote = async (req, res, next) => {
  try {
    const owner = await resolveOwner(req.user);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    const note = await Note.findOne({ _id: req.params.id, ownerId: owner.ownerId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    const { title, description, date, type } = req.body;

    if (title !== undefined) note.title = title.trim();
    if (description !== undefined) note.description = description.trim();
    if (date !== undefined) note.date = date;
    if (type !== undefined) {
      const validTypes = ["Daily", "Weekly", "Monthly", "Yearly"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid note type." });
      }
      note.type = type;
    }

    await note.save();
    return res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/notes/:id
 * @access  Private (staff, client — own only)
 * @desc    Delete a note
 */
const deleteNote = async (req, res, next) => {
  try {
    const owner = await resolveOwner(req.user);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    const note = await Note.findOneAndDelete({ _id: req.params.id, ownerId: owner.ownerId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    return res.status(200).json({ success: true, message: "Note deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
