"use strict";

const expect = require("chai").expect;
const mongoose = require("mongoose");
const async = require("async");
const User = require("../../app/models/user-model");

describe("User Model", () => {

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
    // users.forEach(user => user.save());
    // done();
    // const tasks = users.map(user => () => user.save());
    async.parallel(users.map(user => user.save), done);
  });

  it("should create a new user", (done) => {
    const user = new User({
      profile: { name: "MrTest" },
      email: "test@gmail.com",
      password: "password"
    });
    user.save((err, user) => {
      expect(err).to.not.be.defined;
      expect(user.profile.name).to.equal("MrTest");
      expect(user.email).to.equal("test@gmail.com");
      expect(user).to.have.property("createdAt");
      expect(user).to.have.property("updatedAt");
      done();
    });
  });

  it("should not create a user with duplicate email", (done) => {
    const user = new User({
      profile: { name: "MrCopycat" },
      email: "bobby@bobby.com", // duplicate email
      password: "password"
    });
    user.save((err) => {
      expect(err).to.be.defined;
      expect(err.code).to.equal(11000);
      done();
    });
  });

  it("should find user by email", (done) => {
    User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
      expect(err).to.be.null;
      expect(user.profile.name).to.equal("bobby");
      expect(user.email).to.equal("bobby@bobby.com");
      done();
    });
  });

  it("should delete a user", (done) => {
    User.remove({ email: "bobby@bobby.com" }, (err) => {
      expect(err).to.be.null;
      // done();
      User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
        expect(user).to.not.be.defined;
        done();
      });
    });
  });

  it("won't allow users without names", (done) => {
    const user = new User({
      email: "test2@gmail.com",
      password: "password"
    });
    user.save((err, user) => {
      expect(err).to.be.defined;
      expect(user).to.not.be.defined;
      done();
    });
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

  // compare password works
  // hashes Passwords
  // makes gravatars
});
