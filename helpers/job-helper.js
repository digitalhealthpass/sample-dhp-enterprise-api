/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */
const Logger = require('../config/logger');
const jobsDao = require('../data-access/jobs');

const logger = new Logger('job-helper');

const updateJob = async (txID, status, orgId, jobId) => {
    try {
        const jobs = {};
        jobs.jobId = jobId;
        jobs.status = status;
        jobs.orgId = orgId;
        const jobRes = await jobsDao.updateJob(txID, jobs);
        return jobRes;
    } catch (error) {
        const message = `Error occurred when updating job: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const createJob = async (txID, status, orgId, jobId) => {
    try {
        const jobs = {};
        jobs.jobId = jobId;
        jobs.status = status;
        jobs.orgId = orgId;
        const jobRes = await jobsDao.addJob(txID, jobs);
        logger.response(201, `Successfully added to db: `, txID);
        return jobRes;
    } catch (error) {
        const message = `Error occurred when creating job: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const getAllJobs = async (txID, orgId, jobId) => {
    try {
        const jobRes = await jobsDao.getAllJobs(txID, orgId, jobId);
        if(!jobRes || jobRes.length < 1){
            logger.debug(`Job not found`, txID);
            return { status: 400, payload: [], message: 
                typeof jobId === 'undefined' ? `Jobs not found: ${orgId}` : `Job not found: ${orgId}, ${jobId}`};
        }
        if (typeof jobId === 'undefined')
            return { status: 200, payload: jobRes, message: "Successfully found jobs" };
        return { status: 200, payload: jobRes[0], message: "Successfully found job" };

    } catch (error) {
        const message = `Error occurred when getting jobs: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const deleteJob = async (txID, orgId, jobId) => {
    try {
        logger.info(`Attempting to delete job`, txID);
        return jobsDao.delete(txID, orgId, jobId);
    } catch (error) {
        const message = `Error occurred when deleting job: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

module.exports = {
    updateJob,
    getAllJobs,
    createJob,
    deleteJob
};
