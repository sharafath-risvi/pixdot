const supertest = require("supertest");
const app = require("../server");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Staff = require("../models/Staff");
const Client = require("../models/Client");
const Report = require("../models/Report");

const request = supertest(app);

let adminToken = "";
let staffToken = "";
let clientId = "";
let staffUserId = "";

beforeAll(async () => {
  await connect();
});

afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Daily Reports Endpoints", () => {
  beforeEach(async () => {
    // Setup Admin
    await User.create({ username: "admin1", password: "Password123!", role: "admin" });
    const adminRes = await request.post("/api/auth/login").send({ username: "admin1", password: "Password123!" });
    adminToken = adminRes.body.data.token;

    // Setup Staff User
    const staffUser = await User.create({ username: "staff1", password: "Password123!", role: "staff" });
    staffUserId = staffUser._id;
    const staffRes = await request.post("/api/auth/login").send({ username: "staff1", password: "Password123!" });
    staffToken = staffRes.body.data.token;

    // Setup Staff Profile
    await Staff.create({ userId: staffUserId, name: "Test Staff", role: "Developer" });

    // Setup Client
    const clientUser = await User.create({ username: "client1", password: "Password123!", role: "client" });
    const client = await Client.create({ userId: clientUser._id, name: "Test Client" });
    clientId = client._id;
  });

  describe("POST /api/reports", () => {
    it("should create a report with the provided date string (timezone fix)", async () => {
      const res = await request
        .post("/api/reports")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          clientId,
          status: "completed",
          contentType: "Poster",
          additionalNotes: "Done",
          date: "2026-06-17", // Sending local date string
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe("2026-06-17");
      
      const report = await Report.findById(res.body.data._id);
      expect(report.date).toBe("2026-06-17");
    });
    
    it("should fail with invalid date string", async () => {
      const res = await request
        .post("/api/reports")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          clientId,
          status: "completed",
          contentType: "Poster",
          date: "17-06-2026", // Wrong format
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/reports/date/:date", () => {
    it("should return multiple reports for the same staff member and correctly calculate stats", async () => {
      // Create 2 reports for the SAME staff member for the SAME date
      await Report.create({ staffId: staffUserId, clientId, date: "2026-06-17", status: "completed", contentType: "Poster" });
      await Report.create({ staffId: staffUserId, clientId, date: "2026-06-17", status: "pending", contentType: "Reel" });

      const res = await request
        .get("/api/reports/date/2026-06-17")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.staffStatus.length).toBe(2); // Two rows for the same staff member
      
      const staffRows = res.body.data.staffStatus.filter(s => s.name === "Test Staff");
      expect(staffRows.length).toBe(2);
      expect(staffRows[0].report.contentType).toBe("Poster");
      expect(staffRows[1].report.contentType).toBe("Reel");
      
      // Stats should not be skewed by multiple reports from one staff member
      // Total staff = 1, Submitted staff = 1, Pending staff = 0
      expect(res.body.data.stats.totalReports).toBe(1);
      expect(res.body.data.stats.submitted).toBe(1);
      expect(res.body.data.stats.pending).toBe(0);
    });

    it("should safely handle orphaned staff members without crashing", async () => {
      // Create a user, create staff, then delete the user to make it orphaned
      const tempUser = await User.create({ username: "temp1", password: "Password123!", role: "staff" });
      await Staff.create({ userId: tempUser._id, name: "Orphaned Staff" });
      await User.findByIdAndDelete(tempUser._id);

      const res = await request
        .get("/api/reports/date/2026-06-17")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.staffStatus.length).toBe(1); // Should only include the valid "Test Staff" mapped as Not Submitted
      expect(res.body.data.staffStatus[0].name).toBe("Test Staff");
      expect(res.body.data.staffStatus[0].report).toBeNull();
      
      // The stats should only count the 1 valid staff
      expect(res.body.data.stats.totalReports).toBe(1);
    });
  });
});
