"use strict";

const chai = require("chai");
const expect = chai.expect;
const User = require("../../app/models/user-model");

describe("User Model", () => {
  it("should create a new user", (done) => {
    const user = new User({
      profile: { name: "MrTest" },
      email: "test@gmail.com",
      password: "password"
    });
    user.save((err, user) => {
      expect(err).to.be.null;
      expect(user.profile.name).to.equal("MrTest");
      expect(user.email).to.equal("test@gmail.com");
      expect(user).to.have.property("createdAt");
      expect(user).to.have.property("updatedAt");
      done();
    });
  });

  it("should not create a user with the unique email", (done) => {
    const user = new User({
      profile: { name: "MrTest" },
      email: "test@gmail.com",
      password: "password"
    });
    user.save((err) => {
      expect(err).to.be.defined;
      expect(err.code).to.equal(11000);
      done();
    });
  });

  it("should find user by email", (done) => {
    User.findOne({ email: "test@gmail.com" }, (err, user) => {
      expect(err).to.be.null;
      expect(user.email).to.equal("test@gmail.com");
      done();
    });
  });

  it("should delete a user", (done) => {
    User.remove({ email: "test@gmail.com" }, (err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it("won't allow users without names", (done) => {
    const user = new User({
      email: "test2@gmail.com",
      password: "password"
    });
    user.save((err, user) => {
      expect(err).to.be.defined;
      expect(user).to.be.undefined;
      done();
    });
  });
  // compare password works
  // hashes Passwords
  // makes gravatars
});
