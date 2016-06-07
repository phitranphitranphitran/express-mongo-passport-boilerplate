"use strict";

const router = require("express").Router();
const passport = require("passport");
/**
 * OAuth authentication routes. (Sign in)
 */
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/account");
});
router.get("/github", passport.authenticate("github"));
router.get("/github/callback", passport.authenticate("github", { failureRedirect: "/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/account");
});
router.get("/google", passport.authenticate("google", { scope: "profile email" }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/account");
});
router.get("/twitter", passport.authenticate("twitter"));
router.get("/twitter/callback", passport.authenticate("twitter", { failureRedirect: "/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/account");
});

module.exports = router;
