/* eslint-disable no-underscore-dangle */
/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const Logger = require('../config/logger');
const organizationsDao = require('../data-access/organizations');

const logger = new Logger('organization-helper');

const getOrganization = async (txID, orgId) => {
    
    try {
        logger.info(`Attempting to get organization by ${orgId}`, txID);
        const orgRes = await organizationsDao.get(txID, orgId);
        if(!orgRes){
            logger.debug(`Organization not found`, txID);
            return { status: 404, message: `Organization not found: ${orgId}` };
        }
        return { status: 200, payload: orgRes, message: "Successfully found organization" };
    } catch (error) {
        const message = `Error occurred when getting organization: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const getAllOrgs = async (txID) => {  
    try {
        logger.info(`Attempting to get all organization`, txID);
        const orgRes = await organizationsDao.getAll(txID);
        if(!orgRes){
            logger.debug(`Organization not found`, txID);
            return { status: 404, message: `Organizations not found` };
        }
        return { status: 200, payload: orgRes, message: "Successfully found organization" };
    } catch (error) {
        const message = `Error occurred when getting all organizations: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const createOrganization = async (txID, organization) => {
    try {
        logger.info(`Attempting to create new org`, txID);
        const orgRes = await organizationsDao.create(txID, organization);
        return orgRes;
    } catch (error) {
        const message = `Error occurred when creating organization: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const updateOrganization = async (txID, req) => {
    const organization = req.body;
    // TODO validate request body
    try {
        logger.info(`Attempting to update org`, txID);
        const orgRes = await organizationsDao.update(txID, organization);
        return orgRes;
    } catch (error) {
        const message = `Error occurred when updating organization: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

const deleteOrganization = async (txID, orgId) => {
    try {
        logger.info(`Attempting to delete org`, txID);
        return organizationsDao.delete(txID, orgId);
    } catch (error) {
        const message = `Error occurred when deleting organization: ${error.message}`;
        logger.error(message, txID);
        const err =  { statusCode: error.status, message };
        throw err;
    }
};

module.exports = {
    createOrganization,
    updateOrganization,
    getOrganization,
    deleteOrganization,
    getAllOrgs
};
