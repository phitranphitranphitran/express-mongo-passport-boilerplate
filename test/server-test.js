"use strict";

const expect = require("chai").expect;
const request = require("supertest");
const async = require("async");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../app/models/user-model");

describe("Server", () => {

  describe("User routes", () => {

    // before(done => {
    //   mongoose.connect(process.env.MONGO_URI);
    //   done();
    // });

    beforeEach(done => {
      const users = [
        new User({
          profile: { name: "johnny" },
          email: "johnny@johnny.com",
          password: "johnnyisthebest"
        }),
        new User({
          profile: { name: "bobby" },
          email: "bobby@bobby.com",
          password: "bobbyisthebest"
        }),
        new User({
          profile: { name: "tommy" },
          email: "tommy@tommy.com",
          password: "tommyisthebest"
        })
      ];
      // call done after all users are saved to db
      async.parallel(users.map(user => user.save), done);
    });

    describe("POST /signup", () => {

      it("should register a new local user", (done) => {
        User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
          expect(user).to.not.exist;

          request(app)
            .post("/signup")
            .send({
              name: "jenny",
              email: "jenny@jenny.com",
              password: "jennyisthebest",
              confirmPassword: "jennyisthebest"
            })
            .end((err, res) => {
              expect(err).to.not.exist;

              User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
                expect(err).to.not.exist;
                expect(user).to.exist;
                expect(user.profile.name).to.equal("jenny");
                expect(user.email).to.equal("jenny@jenny.com");
                done();
              });
            });
        });
      });

      it("should redirect to /", (done) => {
        request(app)
          .post("/signup")
          .send({
            name: "jenny",
            email: "jenny@jenny.com",
            password: "jennyisthebest",
            confirmPassword: "jennyisthebest"
          })
          .expect(302)
          .expect("Location", "/")
          .end(done);
      });

      it("should not register mismatched passwords", (done) => {
        User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
          expect(user).to.not.exist;
          request(app)
            .post("/signup")
            .send({
              name: "jenny",
              email: "jenny@jenny.com",
              password: "jennyisthebest",
              confirmPassword: "jennyisNOTthebest"
            })
            .expect(302)
            .expect("Location", "/signup")
            .end((err, res) => {
              User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
                expect(user).to.not.exist;
              });
              done();
            });
        });
      });

      it("should not register existing emails", (done) => {
        request(app)
          .post("/signup")
          .send({
            name: "bobbyCopy",
            email: "bobby@bobby.com",
            password: "bobbyisthebest",
            confirmPassword: "bobbyisthebest"
          })
          .expect(302)
          .expect("Location", "/signup")
          .end((err, res) => {
            User.find({ email: "bobby@bobby.com" }, (err, users) => {
              expect(users.length).to.equal(1);
              expect(users[0].profile.name).to.equal("bobby");
              done();
            });
          });
      });

      // should reject bad input
    });

    afterEach(done => {
      User.remove({}, (err) => {
        done();
      });
    });

    after(done => {
      // need to clear models and schemas because mocha --watch causes new schemas
      // to be created each reload, throwing an OverwriteModelError
      // https://github.com/Automattic/mongoose/issues/1251
      mongoose.models = {};
      mongoose.modelSchemas = {};
      mongoose.disconnect();
      done();
    });

  });



  describe("GET /", () => {
    it("should return 200 OK", (done) => {
      request(app)
        .get("/")
        .expect(200, done);
    });
  });
  //
  // describe("GET /login", () => {
  //   it("should return 200 OK", (done) => {
  //     request(app)
  //       .get("/login")
  //       .expect(200, done);
  //   });
  // });
  //
  // describe("GET /signup", () => {
  //   it("should return 200 OK", (done) => {
  //     request(app)
  //       .get("/signup")
  //       .expect(200, done);
  //   });
  // });
  //
  describe("GET /random-url", () => {
    it("should return 404", (done) => {
      request(app)
        .get("/random-url")
        .expect(404, done);
    });
  });

});
