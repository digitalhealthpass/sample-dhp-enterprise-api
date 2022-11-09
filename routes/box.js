/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const express = require('express');

const {authStrategyFactory } = require('dhp-auth-lib');
const boxController = require('../controllers/box');
const constants = require('../helpers/constants');
const requestLogger = require('../middleware/request-logger');

const router = express.Router();
const checkAuthAdmin = authStrategyFactory.getAuthStrategy(constants.APP_ID_ROLES.HEALTHPASS_ADMIN);
 
router.get('/folders/:folderId', checkAuthAdmin, requestLogger, boxController.getFolder);
router.post('/folders/:folderId/files', checkAuthAdmin, requestLogger, boxController.uploadFile);
router.delete('/files/:fileId', checkAuthAdmin, requestLogger, boxController.deleteFile);
 
module.exports = router;
