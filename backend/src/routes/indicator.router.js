const express = require("express");
const router = express.Router();
const indicatorController = require('../controllers/indicator.controller.js');
const { checkUserRole, checkUser } = require('../utils/autorizationMildware.js');
const indicatorsValidator = require('../validators/indicator.validator.js');

router.get('/indicators', checkUser(), indicatorController.get_indicators);

router.get('/indicators/:id', checkUser(), indicatorController.get_indicator);

router.post('/indicators', checkUserRole('chief_auditor'), indicatorsValidator, indicatorController.create_indicator);

router.put('/indicators/:id', checkUserRole('chief_auditor'), indicatorsValidator, indicatorController.update_indicator);

router.delete('/indicators/:id', checkUserRole('chief_auditor'), indicatorController.delete_indicator);

router.delete('/indicators', checkUserRole('chief_auditor'), indicatorController.delete_indicators);

module.exports = router;