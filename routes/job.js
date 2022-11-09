/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const express = require('express');

const { authStrategyFactory } = require('dhp-auth-lib');
const jobController = require('../controllers/job');
const constants = require('../helpers/constants');
const requestLogger = require('../middleware/request-logger');

const router = express.Router();
const checkAuthAdmin = authStrategyFactory.getAuthStrategy(constants.APP_ID_ROLES.HEALTHPASS_ADMIN);

router.post('/', checkAuthAdmin, requestLogger, jobController.create);
router.put('/', checkAuthAdmin, requestLogger, jobController.update);
router.get('/:entity', checkAuthAdmin, requestLogger, jobController.get);
router.get('/:entity/:jobId', checkAuthAdmin, requestLogger, jobController.get);
router.delete('/:entity/:jobId', checkAuthAdmin, requestLogger, jobController.delete);

module.exports = router;
