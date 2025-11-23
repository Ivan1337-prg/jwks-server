// tests/register.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import request from "supertest";

let app;

beforeAll(async () => {
  const modServer = await import("../src/server.js");
  app = modServer.default || modServer.app || modServer;
});

describe("POST /register", () => {
  test("creates user and returns generated password", async () => {
    const body = {
      username: "userABC",
      email: "userABC@example.com",
    };

    const res = await request(app)
      .post("/register")
      .send(body)
      .set("Content-Type", "application/json");

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("password");
    expect(typeof res.body.password).toBe("string");
    expect(res.body.password.length).toBeGreaterThan(0);
  });
});
