/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { AppIDHelper } = require('dhp-auth-lib');
const config = require('../config/app/config.json');

class AuthHelper {
    constructor() {
        const options = {
            timeout: config.appID.timeout,
            retries: config.appID.retries,
            retryDelay: config.appID.retryDelay,
        };

        this.authService = new AppIDHelper(options);
    }

    /* For KEYCLOAK support
  this.authService = process.env.AUTH_STRATEGY === 'KEYCLOAK'
    ? new KeycloakHelper(options)
    : new AppIDHelper(options)

    then login using this.authService.userLogin({ email, password })
  */

    login(email, password) {
        return this.authService.appIDLogin(email, password);
    }
}

module.exports = AuthHelper;
