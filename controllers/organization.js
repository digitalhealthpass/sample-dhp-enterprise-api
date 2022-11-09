/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const constants = require('../helpers/constants');
const utils = require('../helpers/utils');

const organizationHelper = require('../helpers/organization-helper');
const daoHolder = require('../data-access/holderCredentials');
const { logAndSendErrorResponse } = require('../helpers/utils');
const Logger = require('../config/logger');
const cosHelper = require('../helpers/cos-helper');

const logger = new Logger('organization-controller');

const registerOrganization = async (req, res, txID) => {
    logger.info('Entering POST /organization/register controller', txID);
    const cos = cosHelper.getInstance(txID);

    const errorMsg = utils.validateReqBody(txID, req.body, ['orgId', 'config']);
    if (errorMsg) {
        return logAndSendErrorResponse(txID, res, { statusCode: 400, message: errorMsg }, `registerOrganization`);
    }

    // TODO: validate org with DES
    const organization = req.body;
    const {orgId} = organization;

    logger.debug(`Attempting to onboard organization`, txID);
    try {
        const resBody = await organizationHelper.createOrganization(txID, organization);

        logger.info(`Attempting to create COS bucket for ${orgId}`, txID);
        await cos.createBucket(txID, orgId);

        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            payload: resBody.payload,
            message: resBody.message,
        });
        
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'registerOrganization');
    }
};

const updateOrganization = async (req, res, txID) => {
    logger.info('Entering PUT /organization controller', txID);

    const errorMsg = utils.validateReqBody(txID, req.body, ['orgId', 'config']);
    if (errorMsg) {
        return logAndSendErrorResponse(txID, res, { statusCode: 400, message: errorMsg }, `updateOrganization`);
    }

    // TODO need validation DES to make sure organization exists
    logger.debug(`Attempting to update organization`, txID);
    try {
        const resBody = await organizationHelper.updateOrganization(txID, req);
        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            message: resBody.message,
        });    
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'updateOrganization');
    }
};

const getOrganization = async (req, res, txID) => {
    logger.info('Entering GET /organization/:entity controller', txID); 
    const orgId = req.params.entity;
    // TODO need validation DES to make sure organization exists
    logger.debug(`Attempting to get organization`, txID);
    try {
        const resBody = await organizationHelper.getOrganization(txID, orgId);
        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            payload: resBody.payload,
            message: resBody.message,
        });
        
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'getOrganization');
    }
};

const deleteOrganization = async (req, res, txID) => {
    logger.info('Entering DEL /organization/:entity controller', txID);
    const cos = cosHelper.getInstance(txID);

    const orgId = req.params.entity;
    logger.debug(`Attempting to delete organization`, txID);
    const offboardErrors = [];
    try {
        const resBody = await organizationHelper.deleteOrganization(txID, orgId);
        if (resBody.status !== 200) {
            logger.response(400, resBody.message, txID, req);
            return res.status(400).json({
                error: {
                    message: resBody.message,
                },
            });
        }
        logger.response(resBody.status, `${resBody.message}`, txID);
        // delete all holder-credentials
        try {
            logger.info(`Attempting to delete all holder credentials for ${orgId}`, txID);
            await daoHolder.deleteCredentials(txID, orgId, 0);
        } catch (err) {
            const errMsg = `Error deleting all holder credentials for ${orgId}: ${err.message}`;
            logger.error(errMsg, txID);
            offboardErrors.push({
                status: err.status,
                message: errMsg,
            });
        } 
        // Delete COS bucket
        try {
            logger.info(`Attempting to delete all bucket entries for ${orgId}`, txID);
            await cos.deleteAllFiles(txID, orgId);
            logger.info(`Attempting to delete bucket for ${orgId}`, txID);
            await cos.deleteBucket(txID, orgId);
        } catch (err) {
            const errMsg = `Error occurred deleting COS bucket or contents for ${orgId}: ${err.message}`;
            logger.error(errMsg, txID);
            offboardErrors.push({
                status: err.statusCode,
                message: errMsg,
            });
        }
        if (offboardErrors.length) {
            const errMsg = `Failed to completely offboard organization ${orgId} successfully`;
            logger.error(errMsg, txID);
            return res.status(400).json({
                status: 400,
                message: errMsg,
                payload: offboardErrors,
            });
        }
        return res.status(200).json({ message: `Deleted organization ${orgId} successfully` });
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'deleteOrganization');
    }
};

exports.register = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await registerOrganization(req, res, txID);
};

exports.update = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await updateOrganization(req, res, txID);
};

exports.get = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await getOrganization(req, res, txID);
};

exports.delete = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await deleteOrganization(req, res, txID);
};
