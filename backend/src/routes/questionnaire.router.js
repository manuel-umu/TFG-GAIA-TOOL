const express = require('express');
const router = express.Router();
const questionnaireController = require('../controllers/questionnaire.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.get('/audits/:id/questionnaire', checkUser(), questionnaireController.get_questionnaire);

module.exports = router;
