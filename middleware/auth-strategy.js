/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const appIDAuth = require('./app-id-auth');
const constants = require('../helpers/constants');

// eslint-disable-next-line complexity
const getDESAuthStrategy = (role) => {

    let authStrategy;
    if (role === constants.APP_ID_ROLES.DATA_ADMIN) {
        authStrategy = appIDAuth.authenticateDataAdmin;
    } else {
        authStrategy = appIDAuth.authenticateStandardUser;
    }

    return authStrategy;
};

module.exports = {
    getDESAuthStrategy,
};
