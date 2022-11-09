/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const express = require('express');

const customStrategy = require('../middleware/auth-strategy');
const cosController = require('../controllers/cos');

const constants = require('../helpers/constants');
const requestLogger = require('../middleware/request-logger');

const router = express.Router();
const checkAuthDataAdmin = customStrategy.getDESAuthStrategy(constants.APP_ID_ROLES.DATA_ADMIN);

router.get('/:entity', checkAuthDataAdmin, requestLogger, cosController.getCOSFileNames);
router.get('/:entity/:filename', checkAuthDataAdmin, requestLogger, cosController.getCOSFile);
router.delete('/:entity/:filename', checkAuthDataAdmin, requestLogger , cosController.deleteCOSFile);

module.exports = router;
 