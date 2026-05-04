'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.post('/audits/:id/ai/materiality', checkUser(), aiController.suggest_materiality);

module.exports = router;
