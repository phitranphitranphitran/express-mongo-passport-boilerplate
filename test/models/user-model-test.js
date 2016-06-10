"use strict";

const expect = require("chai").expect;
const mongoose = require("mongoose");
const async = require("async");
const User = require("../../app/models/user-model");

describe("User Model", () => {

  let users;

  before(done => {
    mongoose.connect(process.env.MONGO_TEST_URI);
    mongoose.connection.once("open", () => {
      users = [
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
  });

  describe("Successful creation", () => {

    let newUser;

    it("should create a new user", (done) => {
      const user = new User({
        profile: { name: "MrTest" },
        email: "test@gmail.com",
        password: "password"
      });
      user.save((err, user) => {
        expect(err).to.not.exist;
        expect(user.profile.name).to.equal("MrTest");
        expect(user.email).to.equal("test@gmail.com");
        expect(user).to.have.property("createdAt");
        expect(user).to.have.property("updatedAt");
        newUser = user;
        done();
      });
    });

    it("should delete a user", (done) => {
      newUser.remove(err => {
        expect(err).to.not.exist;
        // done();
        User.findOne({ email: "test@gmail.com" }, (err, user) => {
          expect(user).to.not.exist;
          done();
        });
      });
    });

    it("should find user by email", (done) => {
      User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
        expect(err).to.not.exist;
        expect(user.profile.name).to.equal("bobby");
        expect(user.email).to.equal("bobby@bobby.com");
        done();
      });
    });

    it("should hash passwords", (done) => {
      const user = users[1];
      expect(user.password).to.not.equal("bobbyisthebest");
      done();
    });

    it("should compare passwords", (done) => {
      const user = users[1];
      async.parallel({
        right: user.comparePassword.bind(user, "bobbyisthebest"),
        wrong: user.comparePassword.bind(user, "12345")
      }, (err, isMatches) => {
        expect(err).to.not.exist;
        expect(isMatches.right).to.be.true;
        expect(isMatches.wrong).to.be.false;
        done();
      });
    });

  });

  describe("Validation", () => {

    it("should not create a user with duplicate email", (done) => {
      const user = new User({
        profile: { name: "MrCopycat" },
        email: "bobby@bobby.com", // duplicate email
        password: "password"
      });
      user.save((err) => {
        expect(err).to.exist;
        expect(err.code).to.equal(11000);
        done();
      });
    });

    it("should not allow users without names", (done) => {
      const user = new User({
        email: "test2@gmail.com",
        password: "password"
      });
      user.save((err, user) => {
        expect(err).to.exist;
        expect(user).to.not.exist;
        done();
      });
    });

  });

  after(done => {
    User.remove({}, (err) => {
      // need to clear models and schemas because mocha --watch causes new schemas
      // to be created each reload, throwing an OverwriteModelError
      // https://github.com/Automattic/mongoose/issues/1251
      mongoose.models = {};
      mongoose.modelSchemas = {};
      mongoose.disconnect();
      done();
    });
  });

});
