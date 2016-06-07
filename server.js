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
const sass = require("node-sass-middleware");

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
require("dotenv").config();

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGO_URI, {
	server: {
		socketOptions: { keepAlive: 1 }
	}
});
mongoose.connection.on("error", (err) => {
  console.log("MongoDB connection error ", err);
});
mongoose.connection.once("open", () => {
	console.log("MongoDB connection successful "
		+ (app.get("env") === "development" ? process.env.MONGO_URI : ""));
});

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);
app.set("env", process.env.NODE_ENV || "production");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(compression());
app.use(sass({
  src: path.join(__dirname, "public"),
  dest: path.join(__dirname, "public")
}));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGO_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === "/api/upload") {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

/**
 * Routes handler
 */
app.use(require("./routes"));

/**
 * Error Handlers
 */
app.use((req, res, next) => {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});
app.use((err, req, res, next) => {
  // console.error(err);
  if (!err.hasOwnProperty("status")) {
    err.status = 500;
  }
  if (app.get("env") === "production") {
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
app.listen(app.get("port"), () => {
  console.log("Express server listening on port %d in %s mode", app.get("port"), app.get("env"));
});

module.exports = app;
