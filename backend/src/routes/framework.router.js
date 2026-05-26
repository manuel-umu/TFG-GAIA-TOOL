const express = require('express');
const multer = require('multer');
const router = express.Router();
const frameworkController = require('../controllers/framework.controller.js');
const { checkUser, checkUserRole } = require('../utils/autorizationMildware.js');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.get('/frameworks', checkUser(), frameworkController.get_frameworks);
router.get('/frameworks/versions/:versionId/standards', checkUser(), frameworkController.get_standards_by_version);
router.get('/frameworks/versions/:versionId/standards/:standardId', checkUser(), frameworkController.get_standard_detail);

router.patch('/frameworks/:frameworkId/active', checkUserRole('admin'), frameworkController.toggle_framework_active);
router.patch('/frameworks/versions/:versionId/active', checkUserRole('admin'), frameworkController.toggle_version_active);

router.post('/frameworks/upload/preview', checkUserRole('admin'), upload.single('file'), frameworkController.preview_upload);
router.post('/frameworks/upload/import/:token', checkUserRole('admin'), frameworkController.confirm_import);

module.exports = router;
