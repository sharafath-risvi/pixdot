const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !ADMIN_EMAIL) {
    throw new Error("Missing SMTP Configuration. Please add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and ADMIN_EMAIL to your .env file.");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports like 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const formatInr = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const buildServicesText = (selectedServices) => {
  return selectedServices.map((service) => {
    let text = `- ${service.serviceName}:\n`;
    service.lines.forEach(line => {
      text += `    ${line.label}${line.sub ? ` (${line.sub})` : ""}: ${formatInr(line.price)}\n`;
    });
    text += `  Subtotal: ${formatInr(service.total)}`;
    return text;
  }).join("\n\n");
};

const sendAdminNotification = async (quote) => {
  try {
    const tp = getTransporter();
    const servicesText = buildServicesText(quote.selectedServices);

    const info = await tp.sendMail({
      from: `"Pixdot System" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Quote Request from ${quote.customerName}`,
      text: `A new quote request has been received.

Customer Name: ${quote.customerName}
Email: ${quote.customerEmail}
Phone: ${quote.customerPhone}

Selected Services:
${servicesText}

Total Amount: ${formatInr(quote.totalPrice)}
Date & Time: ${new Date(quote.createdAt).toLocaleString()}
`,
    });
    
    console.log("Admin notification email sent: %s", info.messageId);
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
    throw error;
  }
};

const sendCustomerConfirmation = async (quote) => {
  try {
    const tp = getTransporter();
    const servicesText = buildServicesText(quote.selectedServices);

    const info = await tp.sendMail({
      from: `"Pixdot" <${process.env.SMTP_USER}>`,
      to: quote.customerEmail,
      subject: "Pixdot - Quote Request Received",
      text: `Thank you for contacting Pixdot.

We have successfully received your enquiry.
Our team will contact you shortly.

Customer Name: ${quote.customerName}

Selected Services:
${servicesText}

Total Amount: ${formatInr(quote.totalPrice)}
`,
    });

    console.log("Customer confirmation email sent: %s", info.messageId);
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
    throw error;
  }
};

module.exports = {
  sendAdminNotification,
  sendCustomerConfirmation,
};
