"use strict";

/**
 * Module dependencies.
 */
const express = require("express");
const compression = require("compression");
const session = require("express-session");
const bodyParser = require("body-parser");
const logger = require("morgan");
const lusca = require("lusca");
const MongoStore = require("connect-mongo")(session);
const flash = require("express-flash");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const expressValidator = require("express-validator");

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
require("dotenv").config();

/**
 * Create Express server.
 */
const app = express();

/**
 * environment shorthands
 */
const testing = process.env.NODE_ENV === "test";
const production = process.env.NODE_ENV === "production";

/**
 * Connect to MongoDB.
 */
const mongoUri = testing ? process.env.MONGO_TEST_URI : process.env.MONGO_URI;
const options = testing ? undefined : {
  server: {
    socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 }
  },
  replset: {
    socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 }
  }
};
mongoose.connect(mongoUri, options);
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error \n", err);
});
mongoose.connection.once("open", () => {
	console.log("MongoDB connection successful "
		+ (process.env.NODE_ENV !== "production" ? mongoUri : ""));
});

/**
 * Express configuration.
 */
app.set("env", process.env.NODE_ENV || "production");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: mongoUri,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// disable security middleware during testing (for mock http requests)
if (!testing) {
  app.use(lusca.csrf());
  app.use(lusca.xframe("SAMEORIGIN"));
  app.use(lusca.xssProtection(true));
  app.use(lusca.hsts({ maxAge: 31536000 }));
  app.use(lusca.nosniff());
}
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, "public")));

/**
 * Routes handler
 */
app.use(require("./app/routes"));

/**
 * Error Handlers
 */

// catch 404
app.use((req, res, next) => {
  var err = new Error("Not Found");
  err.status = 404;
  return next(err);
});

app.use((err, req, res, next) => {
  if (testing) {
    console.error(err);
  }
  if (!err.hasOwnProperty("status")) {
		err.status = 500;
  }
  if (production) {
    // no stacktraces leaked to user in production
    err.stack = null;
  }
  res.status(err.status);
  res.render("error", {
    message: err.message,
    error: err
  });
});

/**
 * Start Express server.
 */

module.exports = app;
