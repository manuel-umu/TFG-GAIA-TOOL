const express = require('express');
const router = express.Router();
const frameworkController = require('../controllers/framework.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.get('/frameworks', checkUser(), frameworkController.get_frameworks);
router.get('/frameworks/versions/:versionId/standards', checkUser(), frameworkController.get_standards_by_version);
router.get('/frameworks/versions/:versionId/standards/:standardId', checkUser(), frameworkController.get_standard_detail);

module.exports = router;
