const supertest = require("supertest");
const app = require("../server");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");

const request = supertest(app);
let adminToken = "";
let clientId = "";

beforeAll(async () => {
  await connect();
});

afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Calendar Endpoints", () => {
  beforeEach(async () => {
    await User.create({
      username: "admin_calendartest",
      password: "Password123!",
      role: "admin",
    });

    const loginRes = await request.post("/api/auth/login").send({
      username: "admin_calendartest",
      password: "Password123!",
    });
    adminToken = loginRes.body.data.token;

    // Create a client
    const clientRes = await request
      .post("/api/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Acme Calendars",
        portalUsername: "acmecalendars",
      });
    
    clientId = clientRes.body.data._id;
  });

  describe("POST /api/clients/:clientId/calendar/:type", () => {
    it("should add a content calendar event", async () => {
      const res = await request
        .post(`/api/clients/${clientId}/calendar/content`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          dateKey: "2026-07-20",
          platform: "Instagram",
          contentPlan: "Launch new product",
          status: "pending",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calendarType).toBe("content");
      expect(res.body.data.dateKey).toBe("2026-07-20");
    });

    it("should add a meta ad calendar event", async () => {
      const res = await request
        .post(`/api/clients/${clientId}/calendar/meta`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          dateKey: "2026-07-21",
          campaignName: "Summer Sale",
          adType: "Video",
          budgetAmount: 500,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calendarType).toBe("meta");
      expect(res.body.data.campaignName).toBe("Summer Sale");
    });
  });

  describe("GET /api/clients/:clientId/calendar/:type", () => {
    it("should retrieve content calendar events", async () => {
      await request
        .post(`/api/clients/${clientId}/calendar/content`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          dateKey: "2026-07-20",
          platform: "Instagram",
        });

      const res = await request
        .get(`/api/clients/${clientId}/calendar/content`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data["2026-07-20"]).toBeDefined();
      expect(res.body.data["2026-07-20"].length).toBe(1);
    });
  });
});
