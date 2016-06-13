"use strict";

const passport = require("passport");
const User = require("../models/user-model");

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/account");
  }
  res.render("account/login", {
    title: "Login"
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  validateInputs(req, (errors) => {
    if (errors) {
      req.flash("errors", errors);
      return res.redirect("/login");
    }
    passport.authenticate("local", (err, user, info) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash("errors", info);
        return res.redirect("/login");
      }
      req.logIn(user, (err) => {
        if (err) { return next(err); }
        req.flash("success", { msg: "Success! You are logged in." });
        const redirectTo = req.session.returnTo || "/";
        delete req.session.returnTo;
        return res.redirect(redirectTo);
      });
    })(req, res, next);
  });
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  req.flash("info", { msg: "Logged out." });
  res.redirect("/");
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("account/signup", {
    title: "Create Account"
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
  validateInputs(req, (errors) => {
    if (errors) {
      req.flash("errors", errors);
      return res.redirect("/signup");
    }

    const user = new User({
      email: req.body.email,
      password: req.body.password,
      profile: {
        name: req.body.name,
        picture: User.getGravatar(req.body.email)
      }
    });

    User.findOne({ email: req.body.email }, (err, existingUser) => {
      if (existingUser) {
        req.flash("errors", { msg: "Account with that email address already exists." });
        return res.redirect("/signup");
      }

      user.save((err) => {
        if (err) { return next(err); }
        req.logIn(user, (err) => {
          if (err) { return next(err); }
          req.flash("success", { msg: "Welcome! Account created"});
          return res.redirect("/");
        });
      });
    });
  });
};

/**
 * GET /users/:id
 */
exports.getUserProfile = (req, res) => {
  User.findById(req.params.id, (err, user) => {
    res.render("user/profile", {
      title: user.profile.name,
      profile: user.profile
    });
  });
};

/**
 * GET /account
 * Account settings
 */
exports.getAccount = (req, res) => {
  res.render("account/settings", {
    title: "Account Settings"
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  validateInputs(req, (errors) => {
    if (errors) {
      req.flash("errors", errors);
      return res.redirect("/account");
    }

    const user = req.user;
    if (req.body.email && req.body.email !== user.email) {
      user.email = req.body.email;
      user.profile.picture = User.getGravatar(user.email);
    }
    if (req.body.name) {
      user.profile.name = req.body.name;
    }

    user.save((err) => {
      if (err) {
        // error code 11000 thrown when email is not unique
        if (err.code === 11000) {
          req.flash("errors", { msg: "The email address you have entered is already associated with an account." });
          return res.redirect("/account");
        }
        return next(err);
      }
      req.flash("success", { msg: "Profile information has been updated." });
      return res.redirect("/account");
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert("newPassword", "Password must be at least 4 characters long").len(4);
  req.assert("confirmPassword", "Passwords do not match").equals(req.body.newPassword);
  const errors = req.validationErrors();
  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/account");
  }

  const user = req.user;

  user.comparePassword(req.body.currentPassword, (err, isMatch) => {
    if (err) { return next(err); }
    if (!isMatch) {
      req.flash("errors", { msg: "Current password does not match" });
      return res.redirect("/account");
    }
    user.password = req.body.newPassword;
    user.save((err) => {
      if (err) { return next(err); }
      req.flash("success", { msg: "Password has been changed." });
      return res.redirect("/account");
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash("info", { msg: "Your account has been deleted." });
    return res.redirect("/");
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  const user = req.user;
  user[provider] = undefined;
  user.tokens = user.tokens.filter(token => token.kind !== provider);
  user.save((err) => {
    if (err) { return next(err); }
    const prettyProvider = provider.charAt(0).toUpperCase() + provider.substr(1);
    req.flash("info", { msg: `${prettyProvider} account has been unlinked.` });
    return res.redirect("/account");
  });
};

/**
 * Helper function for validating name, email, password
 * Any additional validations can simply be done before passing req
 */
function validateInputs(req, cb) {
  if (req.body.name) {
    req.sanitize("name").trim();
    req.assert("name", "Name is not valid")
      .notEmpty()
      .matches(/^[a-zA-Z0-9-_\s]+$/)
      .isLength({ min: 3, max: 30 });
  }
  if (req.body.email) {
    req.assert("email", "Email is not valid").isEmail();
    req.sanitize("email").normalizeEmail({ remove_dots: false });
  }
  if (req.body.password) {
    req.assert("password", "Invalid password").notEmpty().len(4);
  }

  return cb(req.validationErrors());
}
