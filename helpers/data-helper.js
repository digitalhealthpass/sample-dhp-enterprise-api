/* eslint-disable complexity */
/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { parse } = require('json2csv');
const jslt = require("jslt");
const desHelper = require('./des-helper');
const boxHelper = require("./box-helper");
const daoHolder = require('../data-access/holderCredentials');
const Logger = require('../config/logger');
const constants = require("./constants");
const config = require('../config');
const organizationHelper = require('./organization-helper');
const credProcessHelper = require('./cred-process-helper');
const CosHelper = require('./cos-helper');

const logger = new Logger('data-helper');

const convertToCSV = (results, client) => {
    const fields = constants.FILTER[client.toUpperCase()].headers || constants.FILTER[client.toUpperCase()].attributes;
    try {
        return parse(results, { fields });
    } catch (error) {
        logger.error(error);
    }
    return null;
};

const prepareMapperId = (schemaId) => {
    return (schemaId.split(';')[1].split('=')[1]) + (schemaId.split(';')[2].split('=')[1]);
};

const addHolderCredentials = async (txID, orgId, credentials, fileName, orgConfig) => {
    let holderCreds = {};
    holderCreds.orgId = orgId;
    holderCreds.fileName = fileName;

    // Org level config param
    holderCreds.employeeType = orgConfig.employeeType || '';

    // default setting to valid becuase DES already handles the validation
    holderCreds.vaccineStatus = constants.CREDENTIAL_STATUS.VALID;
    holderCreds.sentStatusChs = constants.SENT_STATUS.NO;
    holderCreds.sentStatusTririga = constants.SENT_STATUS.NO;

    const idMapper = orgConfig.mappers[prepareMapperId(credentials[1].credentialSchema.id)];
    const metadataMapper = orgConfig.mappers.metadatamapper;
    if (!idMapper) {
        logger.warn("No Id mapper found : cannot process", txID);
        const err = { status: 404, message: `No Id mapper found : cannot process` };
        throw err;
    }
    if (!metadataMapper) {
        logger.warn("No metadata mapper found : cannot process", txID);
        const err = { status: 404, message: `No metadata mapper found : cannot process` };
        throw err;
    }

    holderCreds = {
        ...holderCreds,
        ...jslt.transform(credentials[1], idMapper)
    };
    holderCreds = {
        ...holderCreds,
        ...jslt.transform(credentials[3], metadataMapper)
    };

    [holderCreds.consentReceipt, holderCreds.idCredentials, holderCreds.vaccinationCredentials] = credentials;

    holderCreds.firstName = holderCreds.firstName || holderCreds.fullName;
    holderCreds.lastName = holderCreds.lastName || '';

    // delete additional attributes
    const props = ['fullName'];
    props.forEach(prop => delete holderCreds[prop]);

    const holderCredsRes = await daoHolder.addCredentials(txID, holderCreds);
    logger.response(holderCredsRes.status, `${holderCredsRes.message}`, txID);
};

const prepareData = async (txID, credentialsMetadata, credentialsData, fileName) => {

    const credentials = [];

    if (credentialsMetadata.length < 3) {
        logger.warn(`Deleting COS entry : found less than 3 credentials`, txID);
        return undefined;
    }

    for (let i = 0; i < credentialsMetadata.length; i += 1) {
        const currentMeta = credentialsMetadata[i];
        if ("consentId" in currentMeta) {
            credentials[0] = credentialsData[i];
        } else if (currentMeta.type === "ID") {
            credentials[1] = credentialsData[i];
        } else if ((currentMeta.type === "VACCINATION") || (currentMeta.type === "OA")) {
            if (credentials[3] && (credentials[3].lastVaccination.date > currentMeta.lastVaccination.date)) {
                // eslint-disable-next-line no-continue
                continue;
            }
            else {
                credentials[2] = credentialsData[i];
                credentials[3] = currentMeta;
            }
        }
    }

    for (let i = 0; i < credentials.length; i += 1) {
        if (!credentials[i]) {
            logger.warn(`Missing ${constants.CRED_INDEX[i]} credentials in ${fileName}`, txID);
            return undefined;
        }
    }
    return credentials;
};

const processFile = async (txID, token, orgId, orgConfig, file) => {
    logger.debug(`Processing file ${file}`, txID);
    let fileContent;

    try {
        fileContent = await desHelper.getCOSFiles(txID, token, orgId, file);
        if (!Array.isArray(fileContent.data)) {
            logger.warn(`Deleting COS entry : fileContent is not array type`, txID);
            await desHelper.deleteCOSFile(txID, token, orgId, file);
            return false;
        }
    } catch (err) {
        logger.warn(`Unable to get COS file ${file}: ${err.message}`, txID);
        return false;
    }

    const credentialsData = fileContent.data;
    const last = credentialsData[credentialsData.length - 1];
    
    if (typeof last === 'object' && 'metadata' in last) {
        const credentialsMetadata = last.metadata;
        const credentials = await prepareData(txID, credentialsMetadata, credentialsData, file);

        if (!credentials || credentials.length < 4) {
            logger.warn(`Unable to process credentials ${file}`, txID);
            await desHelper.deleteCOSFile(txID, token, orgId, file);
            return false;
        }

        try {
            await addHolderCredentials(txID, orgId, credentials, file, orgConfig);
        } catch (err) {
            logger.warn(`Unable to add holder credentials ${file}: ${err.message}`, txID);
            return false;
        }

        try {
            await desHelper.deleteCOSFile(txID, token, orgId, file);
        } catch (err) {
            logger.warn(`Unable to delete COS file ${file}: ${err.message}`, txID);
            return false;
        }
    } else {
        logger.warn(`metadata not found try processing credentials`, txID);
        const status = await credProcessHelper.processFile(txID, token, orgId, orgConfig, file, credentialsData);
        return status;
    }
    return true;
};

const persistWorker = async (txID, token, orgId, orgConfig, files) => {
    let failures = 0;
    for (let i = 0; i < files.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const result = await processFile(txID, token, orgId, orgConfig, files[i]);
        if (result === false) {
            failures += 1;
        }
    }
    return failures;
};

const persistAllData = async (txID, token, orgId, orgConfig) => {
    try {
        const start = new Date();

        const cosFiles = await desHelper.getCOSFiles(txID, token, orgId);
        const files = cosFiles.data.payload;

        if (files.length === 0) {
            logger.info(`No files to process ${orgId}`, txID);
            return { status: 201, message: "No files found to process" };
        }

        logger.info(`started processing ${orgId}: ${files.length} files`, txID);

        const { workers } = config.asyncPool;
        const pendingWorkers = [];
        const startLength = files.length;

        for (let i = 1; i <= workers; i += 1) {
            if (i === workers) {
                pendingWorkers.push(persistWorker(txID, token, orgId, orgConfig, files));
                break;
            }
            pendingWorkers.push(persistWorker(
                txID, token, orgId, orgConfig, files.splice(0, Math.floor(startLength / workers)))
            );
        }

        const failures = (await Promise.all(pendingWorkers)).reduce((a, b) => a + b, 0);
        const failurePercent = failures / files.length;
        if (failurePercent > config.failureThresholdPercent) {
            logger.error(`Failure threshold exceeded while processing COS files`, txID);
        }

        const end = new Date();
        const time = Math.abs(end - start);
        return {
            status: 201, message: `finished processing ${startLength} files with ${failures} failures in ${time} ms`
        };
    } catch (error) {
        logger.error(`Unable to fetch any data for ${orgId}: ${error.message}`, txID);
        return error;
    }
};

const persistAllOrgsData = async (txID, token) => {
    try {
        const orgRes = await organizationHelper.getAllOrgs(txID);
        if (orgRes.payload) {
            const orgs = orgRes.payload;
            orgs.map(async (org) => {
                if (org.config.process) {
                    await persistAllData(txID, token, org.orgId, org.config);
                }
            });
        }
    } catch (error) {
        logger.error(`Unable to fetch all orgs: ${error.message}`, txID);
        throw error;
    }
};

const cleanupAllOrgsData = async (txID) => {
    try {
        const orgRes = await organizationHelper.getAllOrgs(txID);
        if (orgRes.payload) {
            const orgs = orgRes.payload;
            orgs.map(async (org) => {
                await daoHolder.deleteCredentials(txID, org.orgId, org.config.cleanup);
            });
        }
    } catch (error) {
        logger.error(`Unable to fetch all orgs: ${error.message}`, txID);
        throw error;
    }
};

const extractEmails = (result) => {
    const emails = result.map(item => {
        return item.email;
    });
    return emails;
};

const getReport = async (txID, orgId, client) => {
    try {
        const results = await daoHolder.getCredentialsReport(txID, orgId, client);
        return results;
    } catch (error) {
        const message = `Unable to update the status: ${error.message}`;
        logger.error(message, txID);
        const err = { statusCode: error.status, message };
        throw err;
    }
};

const updateSentStatus = async (txID, orgId, emails, client) => {
    try {
        return await daoHolder.updateSentStatus(txID, orgId, emails, client);
    } catch (err) {
        logger.error(`Unable to update sent status ${orgId}: ${err.message}`);
        throw err;
    }
};

const publishReport = async (txID, orgId, client, folderId, jobId) => {
    try {
        const timestamp = new Date().toISOString().slice(0, 19)
            .replace(/-/g, "")
            .replace(/T/g, "")
            .replace(/:/g, "");
        const results = await getReport(txID, orgId, client);
        if (results) {
            logger.info(`Preparing report to publish ${results.length}`, txID);
            const reportCSV = convertToCSV(results, client);
            const emails = extractEmails(results);

            const clientPrefix = client.substring(0, 3).toLowerCase();
            if(folderId){
                logger.info(`Publishing report to box ${results.length}`, txID);
                await boxHelper.uploadFile(txID, constants.BOX_UPLOAD_TYPE.FILE_CONTENTS, reportCSV,
                    `${clientPrefix}-report-${timestamp}.csv`, folderId);
            }else{
                logger.info(`Publishing report to cos ${results.length}`, txID);
                const cos = CosHelper.getInstance(txID);
                // upload to COS 
                await cos.createFile(txID, orgId, `${clientPrefix}-report-${timestamp}.csv`, reportCSV);
            }
            
            if (emails && emails.length < 1) {
                logger.info(`Email list is empty to update status`, txID);
                return { status: 201, message: `Successfully published report with ${results.length} records` };
            }
            await updateSentStatus(txID, orgId, emails, client);
            logger.info(`${orgId}-${jobId}: Successfully published report with ${results.length} records`, txID);
            // eslint-disable-next-line max-len
            return { status: 201, message: `${orgId}-${jobId}: Successfully published report with ${results.length} records` };
        }
    } catch (error) {
        logger.error(`${orgId}-${jobId}: Unable to publish report ${orgId}: ${error.message}`);
        const message = `Error occurred publish report ${orgId}:: ${error.message}`;
        const err = { statusCode: error.status || 500, message };
        throw err;
    }
    return { status: 404, message: `No results are found` };
};

const publishAllOrgsData = async (txID) => {
    try {
        const orgRes = await organizationHelper.getAllOrgs(txID);
        if (orgRes.payload) {
            const orgs = orgRes.payload;
            orgs.map(async (org) => {
                if (org.config.holders) {
                    const {holders} = org.config;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const holder of holders) {
                        const format = holder.format || constants.CLIENTS.DEFAULT;
                        const {orgId} = org;
                        const clientPrefix = format.substring(0, 3).toLowerCase();
                        const  jobId = `${orgId}-${clientPrefix}-${constants.JOB_ID.PUBLISH_CRON}`;
                        // eslint-disable-next-line no-await-in-loop
                        await publishReport(txID, orgId, format, holder.folderId || '', jobId );
                    }
                }
            });
        }
    } catch (error) {
        logger.error(`Unable to fetch all orgs: ${error.message}`, txID);
        throw error;
    }
    return null;
};

const getHolderCredentialByEmail = async (txID, email, orgId) => {
    try {
        return await daoHolder.getHolderCredentialByEmail(txID, email, orgId);
    } catch (err) {
        logger.error(`Unable to generate report ${orgId}: ${err.message}`);
        throw err;
    }
};

module.exports = {
    prepareData,
    persistAllData,
    addHolderCredentials,
    convertToCSV,
    getReport,
    getHolderCredentialByEmail,
    publishReport,
    updateSentStatus,
    persistAllOrgsData,
    cleanupAllOrgsData,
    publishAllOrgsData
};
