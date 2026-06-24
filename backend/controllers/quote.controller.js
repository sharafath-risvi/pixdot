const QuoteRequest = require("../models/QuoteRequest");
const { sendAdminNotification, sendCustomerConfirmation } = require("../utils/emailService");

/**
 * @route   POST /api/quotes
 * @access  Public
 * @desc    Submit a new multi-service quote request
 */
const createQuoteRequest = async (req, res, next) => {
  try {
    const { customerName, customerEmail, customerPhone, selectedServices, totalPrice } = req.body;

    // Validate request
    if (!customerName || !customerEmail || !customerPhone || !selectedServices || selectedServices.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    // Save to MongoDB
    const quote = new QuoteRequest({
      customerName,
      customerEmail,
      customerPhone,
      selectedServices,
      totalPrice,
    });

    await quote.save();

    try {
      // Send Emails synchronously, ensuring they are delivered before returning success
      await Promise.all([
        sendAdminNotification(quote),
        sendCustomerConfirmation(quote)
      ]);
    } catch (emailError) {
      console.error("Exact Nodemailer Error:", emailError);
      return res.status(500).json({
        success: false,
        message: emailError.message.includes("Missing SMTP")
          ? emailError.message
          : "Failed to send emails. Please check SMTP configuration or try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Quote request submitted successfully.",
      data: quote,
    });
  } catch (err) {
    console.error("Error creating quote request:", err);
    next(err);
  }
};

module.exports = { createQuoteRequest };
