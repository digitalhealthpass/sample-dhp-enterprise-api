/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const express = require('express');

const customStrategy = require('../middleware/auth-strategy');
const credentialController = require('../controllers/credential');

const constants = require('../helpers/constants');
const requestLogger = require('../middleware/request-logger');

const router = express.Router();
const checkAuthDataAdmin = customStrategy.getDESAuthStrategy(constants.APP_ID_ROLES.DATA_ADMIN);

router.post('/verify', checkAuthDataAdmin, requestLogger, credentialController.verify);

module.exports = router;
