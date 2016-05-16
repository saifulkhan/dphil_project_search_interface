'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./common.controller');

router.post('/treemapbuild', controller.treemapBuild);
//router.post('/treemapdata', controller.treemapData);
router.post('/search', controller.search);
router.post('/feedback', controller.feedback);
router.post('/savesession', controller.savesession);


module.exports = router;
