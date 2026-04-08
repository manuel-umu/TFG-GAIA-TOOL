const express = require("express");
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const { checkUserRole, checkUser } = require('../utils/autorizationMildware.js');
const usersValidator = require('../validators/user.validator.js');

router.post('/register', usersValidator, userController.register);

router.post('/login', userController.login);

router.post('/logout', userController.logout);

router.get('/users/me', userController.user_logged);

router.get('/users', checkUser(), userController.get_users);

router.get('/users/:id', checkUser(), userController.get_user);

router.put('/users/:id', checkUser(), userController.update_user);

router.put('/users/:id/permission', checkUserRole('admin'), userController.change_role_user);

router.put('/users/:id/password', checkUser(), userController.change_password_user);

router.delete('/users/:id', checkUserRole('admin'), userController.delete_user);

router.post('/users/password/recovered', userController.recover_password);

router.post('/users/password/code', userController.check_recover_password);

module.exports = router;