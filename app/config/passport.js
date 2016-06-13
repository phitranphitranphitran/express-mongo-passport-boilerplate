"use strict";

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

const User = require("../models/user-model");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (!user) {
      return done(null, false, { msg: `Email ${email} not found.` });
    }
    user.comparePassword(password, (err, isMatch) => {
      if (isMatch) {
        return done(null, user);
      }
      return done(null, false, { msg: "Invalid email or password." });
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it"s a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user"s email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: "/auth/facebook/callback",
  profileFields: ["name", "email", "link", "locale", "timezone"],
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  // check if a user is already logged in
  if (req.user) {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      // there is already an existing account with the same facebook provider id
      // account merging not supported
      if (existingUser) {
        req.flash("error", { msg: "There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account." });
        return done(err);
      }
      // link new facebook account to logged in account; update if new info
      User.findById(req.user.id, (err, user) => {
        user.facebook = profile.id;
        user.tokens.push({ kind: "facebook", accessToken });
        user.email = user.email || profile._json.email;
        user.profile.name = user.profile.name || profile.name.givenName + " " + profile.name.familyName;
        user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large` || user.profile.picture;
        user.save((err) => {
          req.flash("info", { msg: "Facebook account has been linked." });
          return done(err, user);
        });
      });
    });
  // no user logged in
  } else {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      // account exists, log in
      if (existingUser) {
        return done(null, existingUser);
      }
      // check if an existing account has the same email as the facebook account
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        if (existingEmailUser) {
          req.flash("error", { msg: "There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings." });
          return done(err);
        // create and save a new user with facebook info
        } else {
          const user = new User();
          user.email = profile._json.email;
          user.facebook = profile.id;
          user.tokens.push({ kind: "facebook", accessToken });
          user.profile.name = profile.name.givenName + " " + profile.name.familyName;
          user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.save((err) => {
            return done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: "/auth/github/callback",
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ github: profile.id }, (err, existingUser) => {
      if (existingUser) {
        req.flash("error", { msg: "There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account." });
        return done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          user.github = profile.id;
          user.tokens.push({ kind: "github", accessToken });
          user.email = user.email || profile._json.email;
          user.profile.name = user.profile.name || profile.displayName || profile.username;
          user.profile.picture = profile._json.avatar_url || user.profile.picture;
          user.save((err) => {
            req.flash("info", { msg: "GitHub account has been linked." });
            return done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ github: profile.id }, (err, existingUser) => {
      // github account already exists
      if (existingUser) {
        return done(null, existingUser);
      }
      // github account doesn"t exist
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        // check if github email is under another existing account
        if (existingEmailUser) {
          req.flash("error", { msg: "There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings." });
          return done(err);
        // create new user with github info
        } else {
          const user = new User();
          user.email = profile._json.email;
          user.github = profile.id;
          user.tokens.push({ kind: "github", accessToken });
          user.profile.name = profile.displayName || profile.username;
          user.profile.picture = profile._json.avatar_url;
          user.save((err) => {
            return done(err, user);
          });
        }
      });
    });
  }
}));

// Sign in with Twitter.

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: "/auth/twitter/callback",
  passReqToCallback: true
}, (req, accessToken, tokenSecret, profile, done) => {
  if (req.user) {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (existingUser) {
        req.flash("error", { msg: "There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account." });
        return done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          user.twitter = profile.id;
          user.tokens.push({ kind: "twitter", accessToken, tokenSecret });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = profile._json.profile_image_url_https || user.profile.picture;
          user.save((err) => {
            req.flash("info", { msg: "Twitter account has been linked." });
            return done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = new User();
      user.twitter = profile.id;
      user.tokens.push({ kind: "twitter", accessToken, tokenSecret });
      user.profile.name = profile.displayName;
      user.profile.picture = profile._json.profile_image_url_https;
      user.save((err) => {
        return done(err, user);
      });
    });
  }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: "/auth/google/callback",
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (existingUser) {
        req.flash("error", { msg: "There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account." });
        return done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          user.google = profile.id;
          user.tokens.push({ kind: "google", accessToken });
          user.email = user.email || profile.emails[0].value;
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = profile._json.image.url  || user.profile.picture;
          user.save((err) => {
            req.flash("info", { msg: "Google account has been linked." });
            return done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
        if (existingEmailUser) {
          req.flash("error", { msg: "There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings." });
          return done(err);
        } else {
          const user = new User();
          user.email = profile.emails[0].value;
          user.google = profile.id;
          user.tokens.push({ kind: "google", accessToken });
          user.profile.name = profile.displayName;
          user.profile.picture = profile._json.image.url;
          user.save((err) => {
            return done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect("/login");
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split("/").slice(-1)[0];

  if (req.user.tokens.filter(token => token.kind === provider).length > 0) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
