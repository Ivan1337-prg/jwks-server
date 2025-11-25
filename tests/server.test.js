// tests/server.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import request from "supertest";

let app;

beforeAll(async () => {
  const modServer = await import("../src/server.js");
  app = modServer.default || modServer.app || modServer;
});

describe("Server endpoints", () => {
  test("GET / returns JWKS Server running message", async () => {
    const res = await request(app).get("/").expect(200);
    expect(res.text).toContain("JWKS Server running");
  });

  test("GET /unknown-route returns 404 with error message", async () => {
    const res = await request(app).get("/unknown-route").expect(404);
    expect(res.body.error).toBe("Not Found");
  });

  test("POST /unknown-route returns 404 with error message", async () => {
    const res = await request(app).post("/unknown-route").expect(404);
    expect(res.body.error).toBe("Not Found");
  });
});
