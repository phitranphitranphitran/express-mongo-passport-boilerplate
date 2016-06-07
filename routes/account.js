"use strict";

const router = require("express").Router();
const userController = require('../controllers/user');

router.get('/', userController.getAccount);
router.post('/profile', userController.postUpdateProfile);
router.post('/password', userController.postUpdatePassword);
router.post('/delete', userController.postDeleteAccount);
router.get('/unlink/:provider', userController.getOauthUnlink);

module.exports = router;
