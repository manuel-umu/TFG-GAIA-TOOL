const express = require('express');
const router = express.Router();
const frameworkController = require('../controllers/framework.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

router.get('/frameworks', checkUser(), frameworkController.get_frameworks);
router.get('/frameworks/versions/:versionId/standards', checkUser(), frameworkController.get_standards_by_version);
router.get('/frameworks/versions/:versionId/standards/:standardId', checkUser(), frameworkController.get_standard_detail);

router.post('/frameworks/upload/preview', checkUser(), frameworkController.preview_upload);
router.post('/frameworks/upload/import/:token', checkUser(), frameworkController.confirm_import);

module.exports = router;
