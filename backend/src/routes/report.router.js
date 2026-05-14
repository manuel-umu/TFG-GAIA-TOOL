const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.get('/audits/:id/report', checkUser(), reportController.get_csrd_report);

module.exports = router;
