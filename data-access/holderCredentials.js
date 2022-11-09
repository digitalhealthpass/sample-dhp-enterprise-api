/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { Op } = require("sequelize");
const Logger = require('../config/logger');

const logger = new Logger('holderCredentials-dao');
const dbModels = require('../models/dbmodels');
const constants = require('../helpers/constants');


exports.addCredentials = async (txID, holderCredentials) => {
    const { email, orgId } = holderCredentials;
    const txn = await dbModels.DB.sequelize.transaction();
    try {
        const existing = await dbModels.DB.HolderCredentials.findOne({
            where: { email, orgId }, transaction: txn
        });
        
        if (existing) {
            logger.info(`Holder credentials already exists:  updating`, txID);
            await dbModels.DB.HolderCredentials.update(holderCredentials, 
                { transaction: txn , where: { email, orgId }});
            await txn.commit();
            return { status: 201, message: "updated holder credentials successfully" };
        }

        logger.debug(`Attempt to create new holder credentials`, txID);
        const dbModel = await dbModels.DB.HolderCredentials.create(holderCredentials, { transaction: txn });
        await txn.commit();
        logger.debug(`created holder credentials ${dbModel.holderCredentialsId}`, txID);
        return { status: 201, message: "Successfully created credential" };
    } catch (error) {
        logger.warn(`Error dbOperation adding credentials report: ${error}`, txID);
        await txn.rollback();
        const err = { status: 500, message: `DB add Error: ${error.message}` };
        throw err;
    }
};

exports.getCredentialsReport = async (txID, orgId, client) => {
    logger.debug(`GetAll Credentials ${client}`, txID);
    const filters = constants.FILTER[client.toUpperCase()];
    const whereStatement = {};
    if(constants.IBM_ORGS.includes(orgId)){
        // eslint-disable-next-line no-param-reassign
        orgId = constants.IBM_ORGS;
    }
    whereStatement.orgId = orgId;
    whereStatement.employeeType = filters.employeeType;
    // Updating CHS flag for singapore or CHS
    if ([constants.CLIENTS.CHS, constants.CLIENTS.SG, constants.CLIENTS.DEFAULT].includes(client.toUpperCase())) {
        whereStatement.sentStatusChs = constants.SENT_STATUS.NO;
    } else if (client.toUpperCase() === constants.CLIENTS.TRIRIGA)  {
        whereStatement.sentStatusTririga = constants.SENT_STATUS.NO;
    }
    try {
        const result = await dbModels.DB.HolderCredentials.findAll({
            raw: true,
            attributes: filters.attributes,
            where: whereStatement
        });
        return result;
    } catch (error) {
        logger.error(`Error dbOperation getting credentials report: ${error}`, txID);
        throw error;
    }
};

exports.updateSentStatus = async (txID, orgId, emails, client) => {
    try {
        const filters = constants.FILTER[client.toUpperCase()];
        const stmt = {};
        const whereStatement = {};
        if(constants.IBM_ORGS.includes(orgId)){
            // eslint-disable-next-line no-param-reassign
            orgId = constants.IBM_ORGS;
        }
        whereStatement.orgId = orgId;
        whereStatement.email = emails;
        whereStatement.employeeType = filters.employeeType;
        logger.debug(`Attempt to update ${client} status`, txID);
        if ([constants.CLIENTS.CHS, constants.CLIENTS.SG, constants.CLIENTS.DEFAULT].includes(client.toUpperCase())) {
            stmt.sentStatusChs = constants.SENT_STATUS.YES;
            whereStatement.sentStatusChs = constants.SENT_STATUS.NO;
        } else if (client.toUpperCase() === constants.CLIENTS.TRIRIGA) {
            stmt.sentStatusTririga = constants.SENT_STATUS.YES;
            whereStatement.sentStatusTririga = constants.SENT_STATUS.NO;
        }
        logger.debug(`Attempting to update sent status`, txID);
        const result = await dbModels.DB.HolderCredentials.update(stmt, { where: whereStatement });
        return result;
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB update Error: ${error.message}` };
        throw err;
    }
};

exports.deleteCredentials = async (txID, orgId, num=30) => {
    try {
        const whereStatement = {};
        whereStatement.orgId = orgId;
        logger.debug(`Attempting to delete credentials older than ${num} for org ${orgId}`, txID);
        const result = await dbModels.DB.HolderCredentials.destroy({
            where: {
                updatedAt: {
                    [Op.lte] : (new Date() -  num * 24 * 60 * 60 * 1000)
                },
                orgId
            }
        });
        logger.debug(`${result} credentials are deleted older than ${num} for org ${orgId}`, txID);
        return result;
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB delete Error: ${error.message}` };
        return err;
    }
};

exports.getHolderCredentialByEmail = async (txID, email, orgId) => {
    logger.debug(`Get credentials by email`, txID);
    // const filters = constants.FILTER.VERIFY;
    const whereStatement = {};
    whereStatement.orgId = orgId;
    whereStatement.email = email;
    try {
        const result = await dbModels.DB.HolderCredentials.findOne({
            attributes: ['vaccinationCredentials', 'vaccineStatus', 'fileName'],
            where: whereStatement
        });
        return result;
    } catch (error) {
        logger.error(`Error dbOperation getting holder credential by email: ${error}`, txID);
        const err = { status: 500, message: `DB get Error: ${error.message}` };
        throw err;
    }
};

