"use strict";

const router = require("express").Router();
const passport = require("passport");
/**
 * OAuth authentication routes. (Sign in)
 */
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  successRedirect);

router.get("/github", passport.authenticate("github"));
router.get("/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  successRedirect);

router.get("/google", passport.authenticate("google", { scope: "profile email" }));
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  successRedirect);

router.get("/twitter", passport.authenticate("twitter"));
router.get("/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  successRedirect);

function successRedirect(req, res) {
  req.flash("success", { msg: "Authentication successful" });
  const redirectTo = req.session.returnTo || "/account";
  delete req.session.returnTo;
  return res.redirect(redirectTo);
}

module.exports = router;
