const ContentType = require("../models/ContentType");

exports.getContentTypes = async (req, res) => {
  try {
    const types = await ContentType.find().sort({ name: 1 });
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching content types." });
  }
};

exports.addContentType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required." });

    const existing = await ContentType.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Content type already exists." });
    }

    const type = await ContentType.create({ name });
    res.status(201).json({ success: true, data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error creating content type." });
  }
};
