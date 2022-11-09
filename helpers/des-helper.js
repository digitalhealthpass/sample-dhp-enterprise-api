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

const logger = new Logger('des-helper');

const desAPI = axios.create({
    baseURL: `${config.dataSubmissionAPI.hostname}`,
    timeout: config.des.timeout,
    httpsAgent: tlsHelper.getAgentHeaderForSelfSignedCerts(),
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

const retries = config.des.retries || 3;
const retryDelay = config.des.retryDelay || 3000;

// setup retry-axios config
desAPI.defaults.raxConfig = {
    instance: desAPI,
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

const getCOSFiles = async (txID, token, orgId, fileName) => {
    let path = `/cos/${orgId}`;
    if(fileName){
        path += `/${fileName}`;
    }
    const  params = {};
    params.maxKeys = config.cos.maxKeys;
    
    logger.debug(`call get ${path}`, txID);
    return desAPI.get(path, {
        headers: {
            Authorization: token
        },
        params
    });
};

const deleteCOSFile = async (txID, token, orgId, fileName) => {
    const path = `/cos/${orgId}/${fileName}`;

    logger.debug(`call get ${path}`, txID);
    
    return desAPI.delete(path, {
        headers: {
            Authorization: token
        },
    });
};

const getRegConfig = async (txID, token, orgId) => {
    const path = `/organization/${orgId}/regconfig`;

    logger.debug(`call get ${path}`, txID);
    
    return desAPI.get(path, {
        headers: {
            Authorization: token
        },
    });
};

const getPartnerKey = async (txID, token, orgId, partnerId, keyName) => {
    const path = `/organization/${orgId}/partners/${partnerId}/keys/${keyName}`;

    logger.debug(`call get ${path}`, txID);
    
    return desAPI.get(path, {
        headers: {
            Authorization: token
        },
    });
};

module.exports = {
    getCOSFiles,
    deleteCOSFile,
    getRegConfig,
    getPartnerKey
};
