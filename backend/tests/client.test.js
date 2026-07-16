const supertest = require("supertest");
const app = require("../server");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");

const request = supertest(app);
let adminToken = "";

beforeAll(async () => {
  await connect();
});

afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Client Endpoints", () => {
  beforeEach(async () => {
    await User.create({
      username: "admin_clienttest",
      password: "Password123!",
      role: "admin",
    });

    const loginRes = await request.post("/api/auth/login").send({
      username: "admin_clienttest",
      password: "Password123!",
    });
    adminToken = loginRes.body.data.token;
  });

  describe("POST /api/clients", () => {
    it("should create a client user and profile successfully", async () => {
      const res = await request
        .post("/api/clients")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Acme Corp",
          contactPerson: "Jane Acme",
          portalUsername: "acmecorp",
          portalPassword: "Password123!",
          email: "jane@acmecorp.com",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Acme Corp");
      expect(res.body.data.portalUsername).toBe("acmecorp");

      const clientUser = await User.findOne({ username: "acmecorp" });
      expect(clientUser).toBeTruthy();
      expect(clientUser.role).toBe("client");
    });
  });

  describe("GET /api/clients", () => {
    it("should retrieve a list of clients", async () => {
      await request
        .post("/api/clients")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Acme Corp",
          portalUsername: "acmecorp",
        });

      const res = await request
        .get("/api/clients")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Acme Corp");
      expect(res.body.data[0].portalUsername).toBe("acmecorp");
    });
  });
});
