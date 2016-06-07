"use strict";

const bcrypt = require("bcrypt-nodejs");
const crypto = require("crypto");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,

  facebook: String,
  twitter: String,
  google: String,
  github: String,
  tokens: Array,

  profile: {
    name: { type: String, default: "" },
    picture: { type: String, default: "" }
  }
}, { timestamps: true });

/**
 * Hook method before saving a user
 */
userSchema.pre("save", function (next) {
  const user = this;
  if (!user.profile.picture) {
    user.profile.picture = user.gravatar();
  }
  // hash password via bcrypt if it was changed
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
