const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller.js');
const auditsValidator = require('../validators/audit.validator.js');
const { checkUserRole, checkUser } = require('../utils/autorizationMildware.js');

router.get('/audits', checkUser(), auditController.get_audits);

router.get('/audits/mine', checkUserRole('chief_auditor'), auditController.get_my_audits);

router.get('/audits/assigned', checkUser(), auditController.get_assigned_audits);

router.post('/audits', checkUserRole('chief_auditor'), auditsValidator, auditController.create_audit);

router.put('/audits/:id', checkUserRole('chief_auditor'), auditsValidator, auditController.update_audit);

router.get('/audits/:id',  checkUser(), auditController.get_audit);

router.delete('/audits/:id', checkUserRole('chief_auditor'), auditController.delete_audit);

router.post('/audits/:id/evaluation', checkUser(), auditsValidator, auditController.evaluate_audit);

router.post('/audits/:id/close', checkUserRole('chief_auditor'), auditController.close_audit);

router.get('/audits/:id/processes', checkUser(), auditController.get_processes_from_audit);

module.exports = router;