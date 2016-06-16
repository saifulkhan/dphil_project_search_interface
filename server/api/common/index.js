'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./common.controller');

router.post('/buildtreemap', controller.buildTreemap);
router.post('/zoomtreemap', controller.zoomTreemap);
router.post('/search', controller.search);
router.post('/feedback', controller.feedback);
router.post('/savesession', controller.savesession);


module.exports = router;
