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
    family:4,
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

const buildProposalText = (quote) => {
  const dateObj = quote.createdAt ? new Date(quote.createdAt) : new Date();
  const formattedDate = dateObj.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const servicesText = buildServicesText(quote.selectedServices || []);

  return `Business Proposal from Pixdot

Dear Sir/Madam,

Warm Greetings from Pixdot.

Thank you for the opportunity to present our business proposal.

Pixdot is a full-service creative and business solutions agency committed to helping brands grow through strategic thinking, innovative design, technology, and result-oriented execution.

This proposal outlines the complete scope of services, deliverables, commercial terms, payment structure, and general terms & conditions for your review and approval.

CUSTOMER DETAILS
- Customer Name: ${quote.customerName || "—"}
- Customer Email: ${quote.customerEmail || "—"}
- Customer Phone Number: ${quote.customerPhone || "—"}
- Date & Time of Request: ${formattedDate}

SCOPE OF SERVICES
As discussed, the scope of work will be carried out according to the services selected below.
All deliverables will be executed professionally within the agreed timelines and quality standards.

SELECTED SERVICES
${servicesText}

TOTAL QUOTATION AMOUNT
${formatInr(quote.totalPrice || 0)}

PROFESSIONAL SERVICE FEES
Service Fee
GST: 18% (if applicable)

PAYMENT TERMS
* 70% advance payment is required before commencement of the project/services.
* The remaining 30% shall be payable upon completion or as per the agreed milestone/payment schedule.
* Work will commence only after receipt of the advance payment.
* Delayed payments may result in temporary suspension of services until outstanding dues are cleared.

TERMS AND CONDITIONS
* This proposal is based on the scope mentioned in the approved services.
* Any additional requirements beyond the approved scope will be quoted and billed separately.
* Project timelines are subject to timely approvals, content, and other required inputs from the client.
* Pixdot reserves the right to showcase completed work in its portfolio and marketing materials unless otherwise agreed in writing.
* Any revisions beyond the mutually agreed revision limit may attract additional charges.

We look forward to building a long-term professional relationship and delivering solutions that contribute to your brand's growth and success.

Should you require any clarification, please feel free to contact us.

We look forward to your confirmation.

Thank you for your valuable time and consideration.

Regards,

IBRAHIM ASHIK A
Pixdot – Branding & Business Development

📞 +91 87789 96278
📞 +91 87789 64644
✉️ teampixdot@gmail.com
🌐 www.pixdotsolutions.com
📍 No. 40, First Floor, G.K. Industrial Estate, Alapakkam, Porur, Chennai – 600116`;
};

const buildProposalHtml = (quote) => {
  const dateObj = quote.createdAt ? new Date(quote.createdAt) : new Date();
  const formattedDate = dateObj.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const selectedServices = quote.selectedServices || [];
  let servicesTableRows = "";

  if (selectedServices.length === 0) {
    servicesTableRows = `
      <tr>
        <td colspan="5" style="padding: 16px; text-align: center; color: #64748b; border-bottom: 1px solid #e2e8f0;">No services selected.</td>
      </tr>
    `;
  } else {
    selectedServices.forEach((service, sIndex) => {
      const lines = (service.lines && Array.isArray(service.lines) && service.lines.length > 0)
        ? service.lines
        : [{ label: "—", sub: "—", price: service.total !== undefined ? service.total : 0 }];
      const rowSpan = lines.length;

      lines.forEach((line, lIndex) => {
        const isFirst = lIndex === 0;
        const isLastRow = (sIndex === selectedServices.length - 1) && (lIndex === lines.length - 1);
        const borderBottomStyle = isLastRow ? "none" : (lIndex === lines.length - 1 ? "2px solid #cbd5e1" : "1px solid #f1f5f9");
        const rowBg = sIndex % 2 === 0 ? "#ffffff" : "#f8fafc";

        servicesTableRows += `<tr style="background-color: ${rowBg};">`;

        if (isFirst) {
          servicesTableRows += `<td ${rowSpan > 1 ? `rowspan="${rowSpan}"` : ""} style="padding: 14px 12px; border-bottom: ${borderBottomStyle}; border-right: 1px solid #e2e8f0; vertical-align: top; font-weight: 700; color: #0f172a;">${service.serviceName || "—"}</td>`;
        }

        servicesTableRows += `<td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: top; color: #334155; font-weight: 500;">${line.label || "—"}</td>`;
        servicesTableRows += `<td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: top; color: #64748b;">${line.sub || "—"}</td>`;
        servicesTableRows += `<td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: top; text-align: right; color: #334155;">${formatInr(line.price !== undefined ? line.price : 0)}</td>`;

        if (isFirst) {
          servicesTableRows += `<td ${rowSpan > 1 ? `rowspan="${rowSpan}"` : ""} style="padding: 14px 12px; border-bottom: ${borderBottomStyle}; vertical-align: top; text-align: right; font-weight: 700; color: #0f172a;">${formatInr(service.total !== undefined ? service.total : 0)}</td>`;
        }

        servicesTableRows += `</tr>`;
      });
    });
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Proposal from Pixdot</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-padding { padding: 20px !important; }
      .table-responsive { display: block !important; width: 100% !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 16px 10px;">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="650">
        <tr>
        <td align="center" valign="top" width="650">
        <![endif]-->
        <table class="email-container" width="650" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; text-align: left;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #ffffff; padding: 28px 36px; border-bottom: 2px solid #f1f5f9; text-align: left;" class="content-padding">
              <img src="https://res.cloudinary.com/dxiwvcfs5/image/upload/v1761651795/1_eyzdsa.png" alt="Pixdot" height="42" style="height: 42px; width: auto; display: block; border: 0;" />
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px; text-align: left; background-color: #ffffff;" class="content-padding">
              
              <!-- Title -->
              <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; font-family: Arial, sans-serif;">Business Proposal from Pixdot</h1>

              <!-- Greeting -->
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 12px 0; font-family: Arial, sans-serif;">Dear Sir/Madam,</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0; font-family: Arial, sans-serif;">Warm Greetings from Pixdot.</p>

              <!-- Introduction -->
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0; font-family: Arial, sans-serif;">Thank you for the opportunity to present our business proposal.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0; font-family: Arial, sans-serif;">Pixdot is a full-service creative and business solutions agency committed to helping brands grow through strategic thinking, innovative design, technology, and result-oriented execution.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 28px 0; font-family: Arial, sans-serif;">This proposal outlines the complete scope of services, deliverables, commercial terms, payment structure, and general terms &amp; conditions for your review and approval.</p>

              <!-- Customer Details Box -->
              <table width="100%" cellpadding="18" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 32px 0; width: 100%; font-family: Arial, sans-serif;">
                <tr>
                  <td>
                    <h3 style="font-size: 14px; font-weight: 700; color: #475569; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</h3>
                    <table width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size: 14px; color: #334155;">
                      <tr>
                        <td width="180" style="font-weight: 700; color: #64748b; padding: 4px 0;">Customer Name:</td>
                        <td style="font-weight: 700; color: #0f172a; padding: 4px 0;">${quote.customerName || "—"}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 700; color: #64748b; padding: 4px 0;">Customer Email:</td>
                        <td style="padding: 4px 0;"><a href="mailto:${quote.customerEmail}" style="color: #6366f1; text-decoration: none; font-weight: 600;">${quote.customerEmail || "—"}</a></td>
                      </tr>
                      <tr>
                        <td style="font-weight: 700; color: #64748b; padding: 4px 0;">Customer Phone Number:</td>
                        <td style="color: #0f172a; padding: 4px 0; font-weight: 500;">${quote.customerPhone || "—"}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 700; color: #64748b; padding: 4px 0;">Date &amp; Time of Request:</td>
                        <td style="color: #0f172a; padding: 4px 0;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Scope of Services -->
              <div style="border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin: 0 0 14px 0; display: inline-block;">
                <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">SCOPE OF SERVICES</h2>
              </div>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 12px 0; font-family: Arial, sans-serif;">As discussed, the scope of work will be carried out according to the services selected below.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0; font-family: Arial, sans-serif;">All deliverables will be executed professionally within the agreed timelines and quality standards.</p>

              <!-- Selected Services Table -->
              <div class="table-responsive" style="margin: 0 0 28px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; font-family: Arial, sans-serif; font-size: 14px;">
                  <thead>
                    <tr style="background-color: #0f172a; color: #ffffff; text-align: left; font-weight: bold;">
                      <th style="padding: 14px 12px; border: 1px solid #0f172a;">Service Name</th>
                      <th style="padding: 14px 12px; border: 1px solid #0f172a;">Selected Package</th>
                      <th style="padding: 14px 12px; border: 1px solid #0f172a;">Selected Options</th>
                      <th style="padding: 14px 12px; border: 1px solid #0f172a; text-align: right;">Individual Price</th>
                      <th style="padding: 14px 12px; border: 1px solid #0f172a; text-align: right;">Service Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${servicesTableRows}
                  </tbody>
                </table>
              </div>

              <!-- Total Amount Highlight Box -->
              <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color: #f8fafc; border: 2px solid #6366f1; border-radius: 10px; margin: 0 0 36px 0; width: 100%; font-family: Arial, sans-serif;">
                <tr>
                  <td style="text-align: left; vertical-align: middle;">
                    <span style="font-size: 15px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Quotation Amount</span>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <span style="font-size: 26px; font-weight: 800; color: #6366f1; display: block;">${formatInr(quote.totalPrice || 0)}</span>
                  </td>
                </tr>
              </table>

              <!-- Professional Service Fees -->
              <div style="border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin: 0 0 14px 0; display: inline-block;">
                <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">PROFESSIONAL SERVICE FEES</h2>
              </div>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 6px 0; font-weight: 600;">Service Fee</p>
              <p style="font-size: 15px; line-height: 1.6; color: #64748b; margin: 0 0 32px 0;">GST: 18% (if applicable)</p>

              <!-- Payment Terms -->
              <div style="border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin: 0 0 14px 0; display: inline-block;">
                <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT TERMS</h2>
              </div>
              <ul style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 32px 0; padding-left: 20px; font-family: Arial, sans-serif;">
                <li style="margin-bottom: 8px;">70% advance payment is required before commencement of the project/services.</li>
                <li style="margin-bottom: 8px;">The remaining 30% shall be payable upon completion or as per the agreed milestone/payment schedule.</li>
                <li style="margin-bottom: 8px;">Work will commence only after receipt of the advance payment.</li>
                <li style="margin-bottom: 8px;">Delayed payments may result in temporary suspension of services until outstanding dues are cleared.</li>
              </ul>

              <!-- Terms and Conditions -->
              <div style="border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin: 0 0 14px 0; display: inline-block;">
                <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">TERMS AND CONDITIONS</h2>
              </div>
              <ul style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 36px 0; padding-left: 20px; font-family: Arial, sans-serif;">
                <li style="margin-bottom: 8px;">This proposal is based on the scope mentioned in the approved services.</li>
                <li style="margin-bottom: 8px;">Any additional requirements beyond the approved scope will be quoted and billed separately.</li>
                <li style="margin-bottom: 8px;">Project timelines are subject to timely approvals, content, and other required inputs from the client.</li>
                <li style="margin-bottom: 8px;">Pixdot reserves the right to showcase completed work in its portfolio and marketing materials unless otherwise agreed in writing.</li>
                <li style="margin-bottom: 8px;">Any revisions beyond the mutually agreed revision limit may attract additional charges.</li>
              </ul>

              <!-- Closing Message -->
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 14px 0; font-family: Arial, sans-serif;">We look forward to building a long-term professional relationship and delivering solutions that contribute to your brand's growth and success.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 14px 0; font-family: Arial, sans-serif;">Should you require any clarification, please feel free to contact us.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 14px 0; font-family: Arial, sans-serif;">We look forward to your confirmation.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 36px 0; font-family: Arial, sans-serif;">Thank you for your valuable time and consideration.</p>

              <!-- Regards Section & Contact Details -->
              <div style="border-top: 2px solid #e2e8f0; padding-top: 28px; font-family: Arial, sans-serif;">
                <p style="font-size: 15px; color: #334155; margin: 0 0 10px 0;">Regards,</p>
                <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">IBRAHIM ASHIK A</p>
                <p style="font-size: 14px; font-weight: 600; color: #6366f1; margin: 0 0 22px 0;">Pixdot – Branding &amp; Business Development</p>
                
                <table width="100%" cellpadding="5" cellspacing="0" border="0" style="font-size: 14px; color: #475569; line-height: 1.6;">
                  <tr>
                    <td width="28" style="padding: 4px 0; vertical-align: top;">📞</td>
                    <td style="padding: 4px 0; vertical-align: top;"><a href="tel:+918778996278" style="color: #334155; text-decoration: none; font-weight: 500;">+91 87789 96278</a></td>
                  </tr>
                  <tr>
                    <td width="28" style="padding: 4px 0; vertical-align: top;">📞</td>
                    <td style="padding: 4px 0; vertical-align: top;"><a href="tel:+918778964644" style="color: #334155; text-decoration: none; font-weight: 500;">+91 87789 64644</a></td>
                  </tr>
                  <tr>
                    <td width="28" style="padding: 4px 0; vertical-align: top;">✉️</td>
                    <td style="padding: 4px 0; vertical-align: top;"><a href="mailto:teampixdot@gmail.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">teampixdot@gmail.com</a></td>
                  </tr>
                  <tr>
                    <td width="28" style="padding: 4px 0; vertical-align: top;">🌐</td>
                    <td style="padding: 4px 0; vertical-align: top;"><a href="https://www.pixdotsolutions.com" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 600;">www.pixdotsolutions.com</a></td>
                  </tr>
                  <tr>
                    <td width="28" style="padding: 4px 0; vertical-align: top;">📍</td>
                    <td style="padding: 4px 0; vertical-align: top; color: #334155;">No. 40, First Floor, G.K. Industrial Estate, Alapakkam, Porur, Chennai – 600116</td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Bottom Footer Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 18px 36px; text-align: center; font-size: 12px; color: #94a3b8;" class="content-padding">
              &copy; ${dateObj.getFullYear()} Pixdot Solutions. All rights reserved.
            </td>
          </tr>

        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendAdminNotification = async (quote) => {
  try {
    const tp = getTransporter();
    const textContent = buildProposalText(quote);
    const htmlContent = buildProposalHtml(quote);

    const info = await tp.sendMail({
      from: `"Pixdot System" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Quote Request from ${quote.customerName}`,
      text: textContent,
      html: htmlContent,
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
    const textContent = buildProposalText(quote);
    const htmlContent = buildProposalHtml(quote);

    const info = await tp.sendMail({
      from: `"Pixdot" <${process.env.SMTP_USER}>`,
      to: quote.customerEmail,
      subject: "Pixdot - Quote Request Received",
      text: textContent,
      html: htmlContent,
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
