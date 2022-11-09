/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const axios = require('axios');
const rax = require('retry-axios');
const config = require('../config');
const tlsHelper = require('./tls-helper');
const Logger = require('../config/logger');

const logger = new Logger('cleared4-helper');

const cleared4API = axios.create({
    baseURL: `${config.cleared4.endpoint}`,
    timeout: config.cleared4.timeout,
    httpsAgent: tlsHelper.getAgentHeaderForSelfSignedCerts(),
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

const retries = config.cleared4.retries || 3;
const retryDelay = config.cleared4.retryDelay || 3000;

// setup retry-axios config
cleared4API.defaults.raxConfig = {
    instance: cleared4API,
    retry: retries,
    backoffType: 'static', // options are 'exponential' (default), 'static' or 'linear'
    noResponseRetries: retries, // retry when no response received (such as on ETIMEOUT)
    statusCodesToRetry: [[500, 599]], // retry only on 5xx responses (no retry on 4xx responses)
    retryDelay,
    httpMethodsToRetry: ['POST', 'GET', 'HEAD', 'PUT'],
    onRetryAttempt: (err) => {
        const cfg = rax.getConfig(err);
        logger.warn('No response received from DES, retrying request:');
        logger.warn(`Retry attempt #${cfg.currentRetryAttempt}`);
    },
};

const getUsersListByDate = async (txID, partnerKey, updatedFrom, updatedTo) => {
    const path = `/list_users_advanced?updatedFrom=${updatedFrom}&updatedTo=${updatedTo}`;
    
    logger.debug(`call get ${path}`, txID);
    return cleared4API.get(path, {
        headers: {
            Authorization: `Basic ${partnerKey}`
        }
    });
};

const getUsersList = async (txID, partnerKey) => {
    const path = '/users';
    
    logger.debug(`call get ${path}`, txID);
    return cleared4API.get(path, {
        headers: {
            Authorization: `Basic ${partnerKey}`
        }
    });
};

const getUsersStatus = async (txID, partnerKey, userIds) => {
    const path = `/list_user_status`;

    logger.debug(`call post ${path}`, txID);
    const userReqBody = {
        userIds,
    };
    
    return cleared4API.post(path, userReqBody, {
        headers: {
            Authorization: `Basic ${partnerKey}`
        },
    });
};


module.exports = {
    getUsersList,
    getUsersStatus,
    getUsersListByDate
};
