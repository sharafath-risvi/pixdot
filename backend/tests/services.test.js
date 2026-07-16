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

describe("Service Endpoints", () => {
  beforeEach(async () => {
    await User.create({
      username: "admin_servicetest",
      password: "Password123!",
      role: "admin",
    });

    const loginRes = await request.post("/api/auth/login").send({
      username: "admin_servicetest",
      password: "Password123!",
    });
    adminToken = loginRes.body.data.token;

    // Create a client
    const clientRes = await request
      .post("/api/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Acme Services",
        portalUsername: "acmeservices",
      });
    
    clientId = clientRes.body.data._id;
  });

  describe("POST /api/services", () => {
    it("should assign a service to a client successfully", async () => {
      const res = await request
        .post("/api/services")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          clientId,
          serviceName: "Web Development",
          category: "Development",
          price: 1500,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceName).toBe("Web Development");
      expect(res.body.data.client._id).toBe(clientId);
    });

    it("should fail without clientId", async () => {
      const res = await request
        .post("/api/services")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          serviceName: "Web Development",
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe("GET /api/services", () => {
    it("should retrieve a list of services", async () => {
      await request
        .post("/api/services")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          clientId,
          serviceName: "Web Development",
        });

      const res = await request
        .get("/api/services")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      // It might be > 1 because client creation also creates some default services if passed in, but we pass none here so it should just be 1.
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
