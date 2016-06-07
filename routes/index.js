"use strict";

const router = require("express").Router();
const userController = require('../controllers/user');
const passportConfig = require('../config/passport');
const accountRoutes = require("./account");
const authRoutes = require("./auth");

// home page
router.get('/', (req, res) => {
  res.render('home', {
    title: 'Home'
  });
});

// login, signup
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/logout', userController.logout);
router.get('/signup', userController.getSignup);
router.post('/signup', userController.postSignup);

// account routes
router.use('/account', passportConfig.isAuthenticated, accountRoutes);

// auth routes
router.use('/auth', authRoutes);

module.exports = router;
