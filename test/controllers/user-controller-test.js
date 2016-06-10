// more of an integration test than a unit test
// since mock http requests are sent to the server

"use strict";

const request = require("supertest");
const expect = require("chai").expect;
const async = require("async");
const mongoose = require("mongoose");

const app = require("../../server");
const User = require("../../app/models/user-model");

describe("User Controller", () => {

  let agent;
  let users;

  before(done => {
    mongoose.connect(process.env.MONGO_TEST_URI);
    mongoose.connection.once("open", done);
  });

  beforeEach(done => {
    // superagent; resets login cookies after every test
    agent = request.agent(app);

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

  describe("POST /login", () => {

    it("should log local user in", (done) => {
       agent.post("/login")
        .send({
          email: "tommy@tommy.com",
          password: "tommyisthebest"
        })
        // should redirect after login
        .expect(302)
        .end((err, res) => {
          expect(err).to.not.exist;
          // accessing /account should be OK
           agent.get("/account")
            .expect(200)
            .end((err, res) => {
              expect(err).to.not.exist;
              done();
            });
        });
    });

    it("should deny nonexistant email", (done) => {
       agent.post("/login")
        .send({
          email: "nobody@nobody.com",
          password: "whoami"
        })
        .expect(302)
        .expect("Location", "/login")
        .end((err, res) => {
          expect(err).to.not.exist;

           agent.get("/account")
            .expect(302)
            .expect("Location", "/login")
            .end((err, res) => {
              expect(err).to.not.exist;
              done();
            });
        });
    });

    it("should deny incorrect password", (done) => {
       agent.post("/login")
        .send({
          email: "bobby@bobby.com",
          password: "idontknow"
        })
        .expect(302)
        .expect("Location", "/login")
        .end((err, res) => {
          expect(err).to.not.exist;

           agent.get("/account")
            .expect(302)
            .expect("Location", "/login")
            .end((err, res) => {
              expect(err).to.not.exist;
              done();
            });
        });
    });

  });

  describe("GET /logout", () => {
    it("should deny account access after", (done) => {
      agent.post("/login")
        .send({
          email: "bobby@bobby.com",
          password: "bobbyisthebest"
        })
        .end((err, res) => {

          agent.get("/logout")
            .expect(302)
            .end((err, res) => {
              expect(err).to.not.exist;
              // try to access /acount after logging out
              agent.get("/account")
                .expect(302)
                .expect("Location", "/login")
                .end(done);
            });
        });
    });
  });

  describe("Already logged-in user features", () => {

    beforeEach(done => {
      agent.post("/login")
        .send({
          email: "bobby@bobby.com",
          password: "bobbyisthebest"
        })
        .end(done);
    });

    describe("GET /login", () => {
      it("should redirect to /account if logged in", (done) => {
        agent.get("/login")
          .expect(302)
          .expect("Location", "/account")
          .end(done);
      });
    });

    describe("GET /signup", () => {
      it("should redirect if logged in", (done) => {
        agent.get("/signup")
          .expect(302)
          .end(done);
      });
    });

    describe("GET /account", () => {
      it("should return status 200 OK", (done) => {
        agent.get("/account")
          .expect(200)
          .end(done);
      });
    });

    describe("POST /account/profile", () => {

      it("should update user profile info", (done) => {
          agent.post("/account/profile")
           .send({
             email: "notbobby@notbobby.com",
             name: "notbobby"
           })
           .expect(302)
           .expect("/account")
           .end((err, res) => {

             User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
               expect(err).to.not.exist;
               expect(user).to.not.exist;

               User.findOne({ email: "notbobby@notbobby.com" }, (err, user) => {
                 expect(err).to.not.exist;
                 expect(user).to.exist;
                 expect(user.email).to.equal("notbobby@notbobby.com");
                 expect(user.profile.name).to.equal("notbobby");
                 done();
               });
             });
           });
      });

      it("should not update invalid name", (done) => {
        agent.post("/account/profile")
          .send({
            name: "@#r^&#)wt*ey(583&"
          })
          .expect(302)
          .expect("Location", "/account")
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
              expect(err).to.not.exist;
              expect(user).to.exist;
              expect(user.profile.name).to.equal("bobby");
              done();
            });
          });
      });

      it("should not update invalid email", (done) => {
        agent.post("/account/profile")
          .send({
            email: "@#r^&#)wt*ey(583&"
          })
          .expect(302)
          .expect("Location", "/account")
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "@#r^&#)wt*ey(583&" }, (err, user) => {
              expect(err).to.not.exist;
              expect(user).to.not.exist;

              User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
                expect(err).to.not.exist;
                expect(user).to.exist;
                expect(user.profile.name).to.equal("bobby");
                done();
              });
            });
          });
      });

      it("should trim whitespace from name", (done) => {
        agent.post("/account/profile")
          .send({
            name: "    newbobby    "
          })
          .expect(302)
          .expect("Location", "/account")
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
              expect(err).to.not.exist;
              expect(user.profile.name).to.equal("newbobby");
              done();
            });
          });
      });

    });

    describe("POST /account/password", () => {

      it("should change user password", (done) => {
        agent.post("/account/password")
          .send({
            currentPassword: "bobbyisthebest",
            newPassword: "newpassword123",
            confirmPassword: "newpassword123"
          })
          .expect(302)
          .expect("Location", "/account")
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
              user.comparePassword("newpassword123", (err, isMatch) => {
                expect(err).to.not.exist;
                expect(isMatch).to.be.true;
                done();
              });
            });
          });
      });

      it("should deny incorrect current password", (done) => {
        agent.post("/account/password")
          .send({
            currentPassword: "bobbyisNOTthebest",
            newPassword: "newpassword123",
            confirmPassword: "newpassword123"
          })
          .expect(302)
          .expect("Location", "/account")
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
              // old password should remain
              user.comparePassword("bobbyisthebest", (err, isMatch) => {
                expect(err).to.not.exist;
                expect(isMatch).to.be.true;
                done();
              });
            });
          });
      });

      it("should deny mismatching passwords", (done) => {
        agent.post("/account/password")
          .send({
            currentPassword: "bobbyisthebest",
            newPassword: "newpassword123",
            confirmPassword: "verynewpassword4321"
          })
          .expect(302)
          .expect("Location", "/account")
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
              // old password should remain
              user.comparePassword("bobbyisthebest", (err, isMatch) => {
                expect(err).to.not.exist;
                expect(isMatch).to.be.true;
                done();
              });
            });
          });
      });

    });

    describe("POST /account/delete", () => {
      it("should delete user", (done) => {
        agent.post("/account/delete")
          .expect(302)
          .end((err, res) => {
            expect(err).to.not.exist;

            User.findOne({ email: "bobby@bobby.com" }, (err, user) => {
              expect(err).to.not.exist;
              expect(user).to.not.exist;
              done();
            });
          });
      });
    });

  });

  describe("POST /signup", () => {

    describe("Successful signup", () => {

      beforeEach(done => {
        agent.post("/signup")
          .send({
            name: "jenny",
            email: "jenny@jenny.com",
            password: "jennyisthebest",
            confirmPassword: "jennyisthebest"
          })
          .end(done);
      });

      it("should register a new local user", (done) => {
        User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
          expect(err).to.not.exist;
          expect(user).to.exist;
          expect(user.profile.name).to.equal("jenny");
          expect(user.email).to.equal("jenny@jenny.com");
          done();
        });
      });

      it("should make and set picture to gravatar", (done) => {
        User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
          expect(user.profile.picture).to.contain("gravatar");
          done();
        });
      });

      it("should log new user in", (done) => {
        agent.get("/account")
          .expect(200)
          .end(done);
      });

    });

    describe("Validation", () => {

      it("should not register mismatched passwords", (done) => {
        agent.post("/signup")
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
              expect(err).to.not.exist;
              expect(user).to.not.exist;
              done();
            });
          });
      });

      it("should not register invalid name", (done) => {
        agent.post("/signup")
          .send({
            name: "@#r^&#)wt*ey(583&",
            email: "jenny@jenny.com",
            password: "jennyisthebest",
            confirmPassword: "jennyisthebest"
          })
          .expect(302)
          .expect("Location", "/signup")
          .end((err, res) => {
            User.findOne({ email: "jenny@jenny.com" }, (err, user) => {
              expect(err).to.not.exist;
              expect(user).to.not.exist;
              done();
            });
          });
      });

      it("should not register invalid email", (done) => {
        agent.post("/signup")
          .send({
            name: "jenny",
            email: "@#r^&#)wt*ey(583&",
            password: "jennyisthebest",
            confirmPassword: "jennyisthebest"
          })
          .expect(302)
          .expect("Location", "/signup")
          .end((err, res) => {
            User.findOne({ email: "@#r^&#)wt*ey(583&" }, (err, user) => {
              expect(err).to.not.exist;
              expect(user).to.not.exist;
              done();
            });
          });
      });

      it("should trim whitespace from name", (done) => {
        agent.post("/signup")
          .send({
            name: "          jenny       ",
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

      it("should not register existing emails", (done) => {
        agent.post("/signup")
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

    });

  });

  describe("GET /users/:id", () => {
    it("should render user profile page", (done) => {
      const user = users[1];
      agent.get("/users/" + user.id)
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.text).to.contain(user.profile.name);
          expect(res.text).to.contain(user.profile.picture);
          done();
        });
    });
  });

  afterEach(done => {
    User.remove({}, done);
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
