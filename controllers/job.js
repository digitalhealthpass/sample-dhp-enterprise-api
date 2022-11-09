/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const constants = require('../helpers/constants');

const jobHelper = require('../helpers/job-helper');
const { logAndSendErrorResponse, validateReqBody } = require('../helpers/utils');
const Logger = require('../config/logger');

const logger = new Logger('job-controller');

const createJob = async (req, res, txID) => {
    logger.info('Entering POST /job controller', txID);

    const job = req.body;
    const errMsg = validateReqBody(txID, req.body, ['orgId', 'jobId', 'status']);
    if (errMsg) {
        return logAndSendErrorResponse(txID, res, { statusCode: 400, message: errMsg }, `createJob`);
    };

    logger.debug(`Attempting to create job`, txID);
    try {
        const resBody = await jobHelper.createJob(txID, job.status, job.orgId, job.jobId);
        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            payload: resBody.payload,
            message: resBody.message,
        });
        
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'createJob');
    }
};

const updateJob = async (req, res, txID) => {
    logger.info('Entering PUT /job controller', txID); 
    const job = req.body;
    const errMsg = validateReqBody(txID, req.body, ['orgId', 'jobId', 'status']);

    if (errMsg) {
        return logAndSendErrorResponse(txID, res, { statusCode: 400, message: errMsg }, `updateJob`);
    };
    logger.debug(`Attempting to update job`, txID);
    try {
        const resBody = await jobHelper.updateJob(txID, job.status, job.orgId, job.jobId);
        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            message: resBody.message,
        });     
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'updateJob');
    }
};

const getAllJobs = async (req, res, txID) => {
    logger.info('Entering GET /job/:entity controller', txID); 
    const orgId = req.params.entity;
    const {jobId} = req.params;
    // TODO need validation DES to make sure organization exists
    logger.debug(`Attempting to get all jobs`, txID);
    try {
        const resBody = await jobHelper.getAllJobs(txID, orgId, jobId);
        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            payload: resBody.payload,
            message: resBody.message,
        });
        
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'getAllJobs');
    }
};

const deleteJob = async (req, res, txID) => {
    logger.info('Entering DEL /job/:entity/:jobId controller', txID); 

    const orgId = req.params.entity;
    const {jobId} = req.params;
    logger.debug(`Attempting to delete job`, txID);
    try {
        const resBody = await jobHelper.deleteJob(txID, orgId, jobId);
        logger.response(resBody.status, `${resBody.message}`, txID);
        return res.status(resBody.status).json({
            message: resBody.message,
        });
        
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'deleteJob');
    }
};

exports.create = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await createJob(req, res, txID);
};

exports.update = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await updateJob(req, res, txID);
};

exports.get = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await getAllJobs(req, res, txID);
};

exports.delete = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    await deleteJob(req, res, txID);
};
