/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const axios = require("axios");
const rax = require('retry-axios');
const querystring = require("querystring");
const config = require('../config');
const Logger = require('../config/logger');

const logger = new Logger('iam-helper');

const iamURL = config.IAMServer;
const iamKey = process.env.APP_ID_IAM_KEY;

const validateConfig = () => {
    let missingVar;
    if (!iamKey) {
        missingVar = "APP_ID_IAM_KEY";
    }

    if (missingVar) {
        throw new Error(`Invalid config: missing variable '${missingVar}'`);
    }
};

const axiosClient = () => {
    const axClient = axios.create({
        baseURL: iamURL,
        timeout: config.appID.timeout,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
    });

    const retries = config.appID.retries || 1;
    const retryDelay = config.appID.retryDelay || 3000;

    // setup retry-axios config
    axClient.defaults.raxConfig = {
        instance: axClient,
        retry: retries,
        backoffType: 'static', // options are 'exponential' (default), 'static' or 'linear'
        noResponseRetries: retries, // retry when no response received (such as on ETIMEOUT)
        statusCodesToRetry: [[500, 599]], // retry only on 5xx responses (no retry on 4xx responses)
        retryDelay,
        httpMethodsToRetry: ['POST', 'GET', 'HEAD', 'PUT'],
        onRetryAttempt: (err) => {
            const cfg = rax.getConfig(err);
            logger.warn('No response received from AppID, retrying');
            logger.warn(`Retry attempt #${cfg.currentRetryAttempt}`);
        },
    };

    rax.attach(axClient);
    return axClient;
};

const getIamToken = async () => {
    validateConfig();

    const client = axiosClient();
    const reqBody = {
        apikey: iamKey,
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
    };

    const response = await client.post("/oidc/token", querystring.stringify(reqBody));
    if (response && response.data && response.data.access_token) {
        // logger.debug("Successfully retrieved IAM token");
        return `Bearer ${response.data.access_token}`;
    }
    const errMsg = "Failed to retrieve IAM token, check IAM API Key";
    throw new Error(errMsg);

};

module.exports = {
    getIamToken
};
