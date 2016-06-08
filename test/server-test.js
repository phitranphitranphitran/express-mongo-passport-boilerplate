"use strict";

const request = require("supertest");
const app = require("../server");

describe("Server", () => {

  describe("GET /", () => {
    it("should return status 200 OK", (done) => {
      request(app)
        .get("/")
        .expect(200, done);
    });
  });

  describe("GET /login", () => {
    it("should return status 200 OK", (done) => {
      request(app)
        .get("/login")
        .expect(200, done);
    });
  });

  describe("GET /signup", () => {
    it("should return status 200 OK", (done) => {
      request(app)
        .get("/signup")
        .expect(200, done);
    });
  });

  describe("GET /random-url", () => {
    it("should return status 404", (done) => {
      request(app)
        .get("/random-url")
        .expect(404, done);
    });
  });

});
