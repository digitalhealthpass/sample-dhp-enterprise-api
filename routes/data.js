/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const express = require('express');

const customStrategy = require('../middleware/auth-strategy');
const dataController = require('../controllers/data');

const constants = require('../helpers/constants');
const requestLogger = require('../middleware/request-logger');

const router = express.Router();
const checkAuthDataAdmin = customStrategy.getDESAuthStrategy(constants.APP_ID_ROLES.DATA_ADMIN);

router.post('/:entity/persist', checkAuthDataAdmin, requestLogger, dataController.persist);
router.post('/:entity/partners/:partnerId/persist', checkAuthDataAdmin, requestLogger, 
    dataController.persistPartnerData);

router.post('/:entity/report', checkAuthDataAdmin, requestLogger, dataController.publishReport);
router.post('/:entity/report/:client/:folder', checkAuthDataAdmin, requestLogger, dataController.publishReport);
router.get('/:entity/report/:client', checkAuthDataAdmin, requestLogger, dataController.getReport);

module.exports = router;
