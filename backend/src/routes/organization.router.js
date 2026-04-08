const express = require("express");
const router = express.Router();
const organizationController = require('../controllers/organization.controller.js');
const { checkUserRole, checkUser } = require('../utils/autorizationMildware.js');
const organizationsValidator = require('../validators/organization.validator.js');

router.get('/organizations', checkUser(), organizationController.get_organizations);

router.get('/organizations/factors', checkUser(), organizationController.get_factors);

router.get('/organizations/:id', checkUser(), organizationController.get_organization);

router.post('/organizations', checkUserRole('chief_auditor'), organizationsValidator, organizationController.create_organization);

router.put('/organizations/:id', checkUserRole('chief_auditor'), organizationsValidator, organizationController.update_organization);

router.delete('/organizations/:id', checkUserRole('chief_auditor'), organizationController.delete_organization);

router.get('/organizations/:id/factors', checkUser(), organizationController.get_factors_organization);

router.delete('/organizations', checkUserRole('chief_auditor'), organizationController.delete_organizations);

router.get('/organizations/:id/audits', checkUser(), organizationController.get_audits_from_organization);

module.exports = router;