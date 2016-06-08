"use strict";

const request = require("supertest");
const app = require("../server");

describe("Server", () => {

  describe("GET /", () => {
    it("returns status 200 OK", (done) => {
      request(app)
        .get("/")
        .expect(200, done);
    });
  });

  describe("GET /login", () => {
    it("returns status 200 OK", (done) => {
      request(app)
        .get("/login")
        .expect(200, done);
    });
  });

  describe("GET /signup", () => {
    it("returns status 200 OK", (done) => {
      request(app)
        .get("/signup")
        .expect(200, done);
    });
  });

  describe("GET /random-url", () => {
    it("returns status 404", (done) => {
      request(app)
        .get("/random-url")
        .expect(404, done);
    });
  });

});
