const nodemailer = require("nodemailer");
const { sendAdminNotification, sendCustomerConfirmation } = require("../utils/emailService");

jest.mock("nodemailer");

describe("Mail Service", () => {
  const sendMailMock = jest.fn().mockResolvedValue({ messageId: "test-id" });

  beforeEach(() => {
    nodemailer.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    });
    
    // Set required env vars for the email service
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "test@test.com";
    process.env.SMTP_PASS = "password";
    process.env.ADMIN_EMAIL = "admin@test.com";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const sampleQuote = {
    customerName: "Jane Doe",
    customerEmail: "jane@doe.com",
    customerPhone: "1234567890",
    totalPrice: 1000,
    createdAt: new Date(),
    selectedServices: [
      {
        serviceName: "Web Design",
        total: 1000,
        lines: [
          { label: "Landing Page", price: 1000 }
        ]
      }
    ]
  };

  describe("sendAdminNotification", () => {
    it("should send an email to the admin with the quote details", async () => {
      await sendAdminNotification(sampleQuote);
      
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      
      const emailArgs = sendMailMock.mock.calls[0][0];
      expect(emailArgs.to).toBe("admin@test.com");
      expect(emailArgs.subject).toContain("New Quote Request from Jane Doe");
      expect(emailArgs.html).toContain("Web Design");
      expect(emailArgs.html).toContain("1,000"); // Currency formatting check
    });
  });

  describe("sendCustomerConfirmation", () => {
    it("should send a confirmation email to the customer", async () => {
      await sendCustomerConfirmation(sampleQuote);
      
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      
      const emailArgs = sendMailMock.mock.calls[0][0];
      expect(emailArgs.to).toBe("jane@doe.com");
      expect(emailArgs.subject).toContain("Quote Request Received");
      expect(emailArgs.html).toContain("Jane Doe");
    });
  });
});
