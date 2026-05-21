const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.get('/audits/:id/report/data', checkUser(), reportController.get_csrd_report_data);

module.exports = router;
