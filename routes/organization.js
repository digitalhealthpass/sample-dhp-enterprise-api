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
const organizationController = require('../controllers/organization');
const constants = require('../helpers/constants');
const requestLogger = require('../middleware/request-logger');

const router = express.Router();
const checkAuthAdmin = authStrategyFactory.getAuthStrategy(constants.APP_ID_ROLES.HEALTHPASS_ADMIN);

router.post('/register', checkAuthAdmin, requestLogger, organizationController.register);
router.put('/', checkAuthAdmin, requestLogger, organizationController.update);
router.get('/:entity', checkAuthAdmin, requestLogger, organizationController.get);
router.delete('/:entity', checkAuthAdmin, requestLogger, organizationController.delete);

module.exports = router;
