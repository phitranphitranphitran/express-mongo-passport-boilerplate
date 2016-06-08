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
    // call done after all users are saved to db
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

  it("can compare passwords", (done) => {
    User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
      async.parallel({
        right: user.comparePassword.bind(user, "bobbyisthebest"),
        wrong: user.comparePassword.bind(user, "12345")
      }, (err, isMatches) => {
        expect(err).to.not.be.defined;
        expect(isMatches.right).to.be.true;
        expect(isMatches.wrong).to.be.false;
        done();
      });
    });

    // // non async way
    // User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
    //
    //   user.comparePassword("bobbyisthebest", (err, isMatch) => {
    //     expect(err).to.not.be.defined;
    //     expect(isMatch).to.be.true;
    //
    //     user.comparePassword("12345", (err, isMatch) => {
    //       expect(err).to.not.be.defined;
    //       expect(isMatch).to.be.false;
    //       done();
    //     });
    //   });
    // });
  });

  it("hashes passwords", (done) => {
    const user = new User({
      profile: { name: "MrTest" },
      email: "test@gmail.com",
      password: "password"
    });
    user.save((err, user) => {
      expect(user.password).to.not.equal("password");
      done();
    });
  });

  it("makes gravatars", (done) => {
    const user = new User({
      profile: { name: "MrTest" },
      email: "test@gmail.com",
      password: "password"
    });
    async.parallel({
      existing: User.findOne.bind(User, { email: "bobby@bobby.com" }),
      newUser: user.save
    }, (err, users) => {
      expect(users.existing.gravatar()).to.contain("gravatar");
      expect(users.newUser[0].profile.picture).to.contain("gravatar");
      done();
    });

    // // non async way
    // User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
    //   expect(user.gravatar()).to.contain("gravatar");
    // });
    // const user = new User({
    //   profile: { name: "MrTest" },
    //   email: "test@gmail.com",
    //   password: "password"
    // });
    // user.save((err, user) => {
    //   // makes gravatars on save
    //   expect(user.profile.picture).to.contain("gravatar");
    //   done();
    // });
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
