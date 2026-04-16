const express = require('express');
const router = express.Router();
const materialityController = require('../controllers/materiality.controller.js');
//TODO Para despues cambiar el checkuser por el de los roles
const { checkUser } = require('../utils/autorizationMildware.js');

// GET estandares para evaluar materialidad
router.get('/audits/:id/materiality', checkUser(), materialityController.get_materiality_standards);

// POST guardar evaluacion de materialidad
router.post('/audits/:id/materiality', checkUser(), materialityController.save_materiality);

module.exports = router;
