const express = require('express');
const router = express.Router();
const questionnaireController = require('../controllers/questionnaire.controller.js');
const { checkUser, checkUserRole } = require('../utils/autorizationMildware.js');

router.get('/audits/:id/questionnaire', checkUser(), questionnaireController.get_questionnaire);
router.post('/audits/:id/questionnaire', checkUser(), questionnaireController.save_questionnaire);
router.post('/audits/:id/questionnaire/validate', checkUserRole('chief_auditor'), questionnaireController.validate_questionnaire);

module.exports = router;
