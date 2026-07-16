const supertest = require("supertest");
const app = require("../server");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");

const request = supertest(app);

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Auth Endpoints", () => {
  describe("POST /api/auth/login", () => {
    it("should login successfully and return a token", async () => {
      await User.create({
        username: "testadmin",
        password: "Password123!",
        role: "admin",
      });

      const res = await request.post("/api/auth/login").send({
        username: "testadmin",
        password: "Password123!",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.role).toBe("admin");
    });

    it("should fail with invalid credentials", async () => {
      const res = await request.post("/api/auth/login").send({
        username: "testadmin",
        password: "WrongPassword!",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should get current user info with valid token", async () => {
      await User.create({
        username: "testuser",
        password: "Password123!",
        role: "staff",
      });

      const loginRes = await request.post("/api/auth/login").send({
        username: "testuser",
        password: "Password123!",
      });
      const token = loginRes.body.data.token;

      const res = await request
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe("testuser");
      expect(res.body.data.user.role).toBe("staff");
    });

    it("should fail without token", async () => {
      const res = await request.get("/api/auth/me");
      expect(res.statusCode).toEqual(401);
    });
  });
});
