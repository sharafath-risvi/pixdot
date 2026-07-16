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

describe("Staff Endpoints", () => {
  beforeEach(async () => {
    await User.create({
      username: "admin_stafftest",
      password: "Password123!",
      role: "admin",
    });

    const loginRes = await request.post("/api/auth/login").send({
      username: "admin_stafftest",
      password: "Password123!",
    });
    adminToken = loginRes.body.data.token;
  });

  describe("POST /api/staff", () => {
    it("should create a staff user and profile successfully", async () => {
      const res = await request
        .post("/api/staff")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "John Doe",
          username: "johndoe",
          password: "Password123!",
          role: "Designer",
          email: "johndoe@example.com",
          salary: "5000",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("John Doe");
      expect(res.body.data.username).toBe("johndoe");
      expect(res.body.data.role).toBe("Designer");

      // Verify the associated user account is created
      const staffUser = await User.findOne({ username: "johndoe" });
      expect(staffUser).toBeTruthy();
      expect(staffUser.role).toBe("staff");
    });

    it("should fail to create a staff member if not admin", async () => {
      // Create a staff user to try and create another staff user
      await User.create({
        username: "hacker_staff",
        password: "Password123!",
        role: "staff",
      });

      const hackerLoginRes = await request.post("/api/auth/login").send({
        username: "hacker_staff",
        password: "Password123!",
      });
      const hackerToken = hackerLoginRes.body.data.token;

      const res = await request
        .post("/api/staff")
        .set("Authorization", `Bearer ${hackerToken}`)
        .send({
          name: "Jane Doe",
          username: "janedoe",
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe("GET /api/staff", () => {
    it("should retrieve a list of staff members", async () => {
      // Create a staff user
      await request
        .post("/api/staff")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "John Doe",
          username: "johndoe",
        });

      const res = await request
        .get("/api/staff")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("John Doe");
      expect(res.body.data[0].username).toBe("johndoe");
    });
  });
});
