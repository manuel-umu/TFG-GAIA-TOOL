const express = require('express');
const router = express.Router();
const frameworkController = require('../controllers/framework.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.get('/frameworks', checkUser(), frameworkController.get_frameworks);

module.exports = router;
