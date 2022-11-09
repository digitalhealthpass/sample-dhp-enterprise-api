/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const Logger = require('../config/logger');

const logger = new Logger('holder-dao');
const dbModels = require('../models/dbmodels');

exports.getAllJobs = async (txID, orgId, jobId) => {
    try {
        const whereStatement = {};
        if(orgId){
            whereStatement.orgId = orgId;
        }
        if(jobId){
            whereStatement.jobId = jobId;
        }
        logger.debug(`GetAll jobs`, txID);
        const result = await dbModels.DB.Jobs.findAll({
            where: whereStatement
        });
        return result;
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB get Error: ${error.message}` };
        throw err;
    }
};

exports.addJob = async (txID, jobs) => {
    try {
        const { orgId, jobId } = jobs;
        if(orgId !== "all"){
            const org = await dbModels.DB.Organizations.findByPk(orgId);
            if (!org) {
                logger.debug(`Organization does not exist`, txID);
                return { status: 400, message: `Organization does not exist: ${orgId}` };
            }
        }
        const existing = await dbModels.DB.Jobs.findAll({
            where: { orgId, jobId }
        });
        if (existing && existing.length > 0) {
            logger.debug(`Job already registered`, txID);
            return { status: 400, message: "Job already registered" };
        }
        logger.debug(`Attempting to create job entry`, txID);
        // Item not found, create a new one
        const result = await dbModels.DB.Jobs.create(jobs);
        return { status: 201, payload: result, message: "Successfully created job" };
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB insert Error: ${error.message}` };
        throw err;
    }
};

exports.updateJob = async (txID, job) => {
    const txn = await dbModels.DB.sequelize.transaction();
    try {
        const { orgId, jobId } = job;
        const existing = await dbModels.DB.Jobs.findOne({
            where: { orgId, jobId }, transaction: txn
        });
        if (existing) {
            logger.debug(`Attempting to update job`, txID);
            await dbModels.DB.Jobs.update(job, { transaction: txn , where: { orgId, jobId } });
            await txn.commit();
            return { status: 201, message: "Updated job successfully"};
        }
        logger.debug(`Job not found`, txID);
        return { status: 400, message: `Job not found: ${orgId}, ${jobId}`, result: false};
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        await txn.rollback();
        const err = { status: 500, message: `DB update Error: ${error.message}` };
        throw err;
    }
};

exports.delete = async (txID, orgId, jobId) => {
    try {
        const result = await dbModels.DB.Jobs.findOne({where: {orgId, jobId}});
        if (!result) {
            logger.debug(`Job not found`, txID);
            return { status: 404, message: `Job not found: ${orgId}, ${jobId}` };
        }
        await result.destroy();
        return { status: 200, message: `Successfully deleted ${orgId}, ${jobId}` };
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB delete Error: ${error.message}` };
        throw err;
    }
};
