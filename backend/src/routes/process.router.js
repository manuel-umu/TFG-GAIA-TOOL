const express = require("express");
const router = express.Router();
const processController = require('../controllers/process.controller.js');
const { checkUserRole, checkUser } = require('../utils/autorizationMildware.js');
const processesValidator = require('../validators/process.validator.js');

router.get('/processes', checkUser(), processController.get_processes);

router.get('/processes/:id/organization', checkUserRole('evaluator_auditor'), processController.get_organization_from_process);

router.get('/processes/:id/indicators', checkUserRole('evaluator_auditor'), processController.get_indicators_from_process);

router.post('/processes', checkUserRole('chief_auditor'), processesValidator, processController.create_process);

router.get('/processes/:id', checkUser(), processController.get_process);

router.put('/processes/:id', checkUserRole('chief_auditor'), processesValidator, processController.update_process);

router.delete('/processes', checkUserRole('chief_auditor'), processController.delete_processes);

router.delete('/processes/:id', checkUserRole('chief_auditor'), processController.delete_process);

module.exports = router;