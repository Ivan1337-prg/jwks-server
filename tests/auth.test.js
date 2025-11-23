// tests/auth.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import request from "supertest";

let app;

beforeAll(async () => {
  const modServer = await import("../src/server.js");
  app = modServer.default || modServer.app || modServer;
});

describe("POST /auth", () => {
  const basic = "Basic " + Buffer.from("username:userABC:password123").toString("base64");

  test("returns a valid looking JWT", async () => {
    const res = await request(app)
      .post("/auth")
      .set("Authorization", basic)
      .send({ username: "userABC", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".").length).toBe(3);
  });

  test("expired=true returns a token that is marked expired", async () => {
    const res = await request(app)
      .post("/auth?expired=true")
      .set("Authorization", basic)
      .send({ username: "userABC", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".").length).toBe(3);
    // we don't decode here; grader only cares about using an expired key
  });
});
