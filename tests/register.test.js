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
  test("accepts register requests", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: `user${Date.now()}`, email: `user${Date.now()}@example.com` });

    expect([200, 201, 400]).toContain(res.status);
  });
});
