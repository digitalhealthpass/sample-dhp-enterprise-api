/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */


// @TODO Replace helper and app-id-helper with dhp-auth-lib when it will be implemented in dhp-des-api
const { v4: uuidv4 } = require('uuid');
const dataHelper = require('../../helpers/data-helper');
const partnerDataHelper = require('../../helpers/partner-data-helper');
const organizationHelper = require('../../helpers/organization-helper');
const jobHelper = require('../../helpers/job-helper');
const Logger = require('../../config/logger');
const config = require("../../config/app/config.json");
const constants = require('../../helpers/constants');
const getCache = require('../../helpers/token-helper');

const logger = new Logger('enterprise-cron-job');

const tririgaFolderId = process.env.BOX_CLIENTS_TRIRIGA_FOLDERID;
const chsFolderId = process.env.BOX_CLIENTS_CHS_FOLDERID;
const sgFolderId = process.env.BOX_CLIENTS_SG_FOLDERID;

const processResponse = (res) => {
    if (res.status !== 201) {
        return false;
    }
    return true;
};

const deleteJob = async (txID, orgId, jobId, logString) => {
    try {
        const resBody = await jobHelper.deleteJob(txID, orgId, jobId);
        logger.info(`${resBody.message}`, txID);
    } catch (error) {
        logger.error(`${logString}: Unable to delete job : ${error.message}`);
    }
};

const canStart = async (txID, orgId, jobId, staleMins) => {
    try {
        const jobRes = await jobHelper.getAllJobs(txID, orgId, jobId);
        if (jobRes.payload) {
            if (jobRes.payload.length < 1) {
                logger.info('No job is running/done: ', txID);
                const res = await jobHelper.createJob(txID, constants.JOB_STATUS.START, orgId, jobId);
                return processResponse(res);
            }
            const job = jobRes.payload;
            if (job.status !== constants.JOB_STATUS.RUNNING) {
                logger.info('Found no running job', txID);
                const res = await jobHelper.updateJob(txID, constants.JOB_STATUS.RUNNING, orgId, jobId);
                return processResponse(res);
            }
            // If not running check on stale status
            const now = new Date().getTime();
            const diff = now - job.updatedAt.getTime();
            const staleTime = staleMins * 60 * 1000;
            if (diff > staleTime) {
                logger.warn(`Found stale process enterprise data`, txID);
                const res = jobHelper.updateJob(txID, constants.JOB_STATUS.START, orgId, jobId);
                return processResponse(res);
            }
            return false;
        }
    }
    catch (error) {
        logger.error(`unable to fetch all jobs for ${orgId} and ${jobId} : ${error}`, txID);
        return false;
    }
    return false;
};

const processEnterpriseData = async (jobConfig) => {
    const txID = uuidv4();
    const {orgId, staleMins} = jobConfig;
    try {
        const canRun = await canStart(txID, orgId, constants.JOB_ID.PROCESS_CRON, staleMins);
        if (!canRun) {
            logger.info(`${orgId}-process: Job is already running wait`, txID);
            return;
        }
        logger.info(`${orgId}-process: Starting job to process data`, txID);
        const start = new Date().getTime();
        const token = await getCache().getToken();
        await dataHelper.persistAllOrgsData(txID, `Bearer ${token.access_token}`);
        await jobHelper.updateJob(txID, constants.JOB_STATUS.DONE, orgId, constants.JOB_ID.PROCESS_CRON);
        const end = new Date().getTime();
        const duration = end - start;
        logger.info(`${orgId}-process: Finished job in ${duration}`, txID);
    } catch (error) {
        logger.error(`${orgId}-process: Unable to process data: ${error.message}`, txID);
        deleteJob(txID, orgId, constants.JOB_ID.PROCESS_CRON, `${orgId}-process`);
    }
};

const persistPartnerData = async (jobConfig) => {
    const txID = uuidv4();
    const {orgId, staleMins} = jobConfig;
    try {
        const canRun = await canStart(txID, orgId, constants.JOB_ID.PERSIST_CRON, staleMins);
        if (!canRun) {
            logger.info(`${orgId}-persist: Job is already running wait`, txID);
            return;
        }
        logger.info(`${orgId}-persist: Starting job to persist data`, txID);
        const start = new Date().getTime();
        const token = await getCache().getToken();
        await partnerDataHelper.persistAllOrgs(txID, `Bearer ${token.access_token}`);
        await jobHelper.updateJob(txID, constants.JOB_STATUS.DONE, orgId, constants.JOB_ID.PERSIST_CRON);
        const end = new Date().getTime();
        const duration = end - start;
        logger.info(`${orgId}-persist: Finished job in ${duration}`, txID);
    } catch (error) {
        logger.error(`${orgId}-persist: Unable to process data: ${error.message}`, txID);
        deleteJob(txID, orgId, constants.JOB_ID.PERSIST_CRON, `${orgId}-persist`);
    }
};

const publishData = async (client, folderId, jobConfig) => {
    const txID = uuidv4();
    const {orgId} = jobConfig;
    const clientPrefix = client.substring(0, 3).toLowerCase();
    let jobId = `${clientPrefix}-${constants.JOB_ID.PUBLISH_CRON}`;
    if(constants.CLIENTS.DEFAULT === client){
        jobId = `orgId-${jobId}`;
    }
   
    try {
        const org = await organizationHelper.getOrganization(txID, orgId);
        if (org.status !== 200) {
            logger.info(`${orgId} is not registered to run the job`, txID);
            return;
        }
        const canRun = await canStart(txID, orgId, jobId, jobConfig.staleMins);
        if (!canRun) {
            logger.info(`${orgId}-${jobId}: Job is already running wait`, txID);
            return;
        }
        logger.info(`${orgId}-${jobId}: Starting job to publish data`, txID);

        const start = new Date().getTime();
        await dataHelper.publishReport(txID, orgId, client, folderId, jobId);
        await jobHelper.updateJob(txID, constants.JOB_STATUS.DONE, orgId, jobId);
        const end = new Date().getTime();
        const duration = end - start;
        logger.info(`${orgId}-${jobId}: Finished job in ${duration} `, txID);
    } catch (error) {
        logger.error(`${client}-publish: Unable to process data: ${error.message}`);
        deleteJob(txID, orgId, jobId, `${orgId}-${jobId}`);
    }
};

const publishEnterpriseData = async (jobConfig) => {
    const txID = uuidv4();
    const {orgId} = jobConfig;
    try {
        const canRun = await canStart(txID, orgId, constants.JOB_ID.PUBLISH_CRON, jobConfig.staleMins);
        if (!canRun) {
            logger.info(`${orgId}-${constants.JOB_ID.PUBLISH_CRON}: Job is already running wait`, txID);
            return;
        }
        logger.info(`${orgId}-${constants.JOB_ID.PUBLISH_CRON}: Starting job to publish data`, txID);

        const start = new Date().getTime();
        await dataHelper.publishAllOrgsData(txID);
        await jobHelper.updateJob(txID, constants.JOB_STATUS.DONE, orgId, constants.JOB_ID.PUBLISH_CRON);
        const end = new Date().getTime();
        const duration = end - start;
        logger.info(`${constants.JOB_ID.PUBLISH_CRON}: Finished job in ${duration} `, txID);
    } catch (error) {
        logger.error(`${constants.JOB_ID.PUBLISH_CRON}: Unable to process data: ${error.message}`);
        deleteJob(txID, orgId, constants.JOB_ID.PUBLISH_CRON, `${orgId}-${constants.JOB_ID.PUBLISH_CRON}`);
    }
};

const cleanupData = async (cleanupConfig) => {
    const txID = uuidv4();
    const {orgId, staleMins} = cleanupConfig;
    try {
        const canRun = await canStart(txID, orgId, constants.JOB_ID.CLEANUP_CRON, staleMins);
        if (!canRun) {
            logger.info(`${orgId}-cleanup: Job is already running wait`, txID);
            return;
        }
        logger.info(`${orgId}-cleanup: Starting job to cleanup data`, txID);
        const start = new Date().getTime();
        const token = await getCache().getToken();
        await dataHelper.cleanupAllOrgsData(txID, `Bearer ${token.access_token}`);
        await jobHelper.updateJob(txID, constants.JOB_STATUS.DONE, orgId, constants.JOB_ID.CLEANUP_CRON);
        const end = new Date().getTime();
        const duration = end - start;
        logger.info(`${orgId}-cleanup: Finished job in ${duration}`, txID);
    } catch (error) {
        logger.error(`${orgId}-cleanup: Unable to process data: ${error.message}`, txID);
        deleteJob(txID, orgId, constants.JOB_ID.CLEANUP_CRON, `${orgId}-cleanup`);
    }
};

module.exports = {
    processData: {
        name: config.orgs.jobs.process.name,
        action: () => processEnterpriseData(config.orgs.jobs.process),
        schedule: config.orgs.jobs.process.schedule,
        option: config.orgs.jobs.process.option
    },
    publishDataTRIRIGA: {
        name: config.orgs.jobs.tririga.name,
        action: () => publishData(constants.CLIENTS.TRIRIGA, tririgaFolderId, config.orgs.jobs.tririga),
        schedule: config.orgs.jobs.tririga.schedule,
        option: config.orgs.jobs.tririga.option
    },
    publishDataCHS: {
        name: config.orgs.jobs.chs.name,
        action: () => publishData(constants.CLIENTS.CHS, chsFolderId, config.orgs.jobs.chs),
        schedule: config.orgs.jobs.chs.schedule,
        option: config.orgs.jobs.chs.option
    },
    publishDataSG: {
        name: config.orgs.jobs.sg.name,
        action: () => publishData(constants.CLIENTS.SG, sgFolderId, config.orgs.jobs.sg),
        schedule: config.orgs.jobs.sg.schedule,
        option: config.orgs.jobs.sg.option
    },
    persistPartnerData: {
        name: config.orgs.jobs.partner.name,
        action: () => persistPartnerData(config.orgs.jobs.partner),
        schedule: config.orgs.jobs.partner.schedule,
        option: config.orgs.jobs.partner.option
    },
    cleanupData: {
        name: config.orgs.jobs.cleanup.name,
        action: () => cleanupData(config.orgs.jobs.cleanup),
        schedule: config.orgs.jobs.cleanup.schedule,
        option: config.orgs.jobs.cleanup.option
    },
    publishAllData: {
        name: config.orgs.jobs.publish.name,
        action: () => publishEnterpriseData(config.orgs.jobs.publish),
        schedule: config.orgs.jobs.publish.schedule,
        option: config.orgs.jobs.publish.option
    },
    publishData,
    processEnterpriseData,
    canStart,
    processResponse,
    deleteJob
};
