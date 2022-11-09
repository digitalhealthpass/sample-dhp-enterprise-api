/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const Logger = require('../config/logger');

const logger = new Logger('organization-dao');
const dbModels = require('../models/dbmodels');

exports.get = async (txID, orgId) => {
    try {
        const result = await dbModels.DB.Organizations.findByPk(orgId);
        return result;
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB get Error: ${error.message}` };
        throw err;
    }
};

exports.getAll = async (txID) => {
    try {
        const result = await dbModels.DB.Organizations.findAll();
        return result;
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB get Error: ${error.message}` };
        throw err;
    }
};

exports.create = async (txID, organization) => {
    try {
        const { orgId } = organization;
        const existing = await dbModels.DB.Organizations.findAll({
            where: { orgId }
        });
        if (existing && existing.length > 0) {
            logger.debug(`Organization already registered`, txID);
            return { status: 400, message: "Organization already registered" };
        }
        logger.debug(`Attempting to create organization`, txID);
        const result = await dbModels.DB.Organizations.create(organization);
        return { status: 201, payload: result, message: "Successfully created organization" };
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB insert Error: ${error.message}` };
        throw err;
    }
};

exports.update = async (txID, organization) => {
    try {
        const { orgId } = organization;
        const existing = await dbModels.DB.Organizations.findAll({
            where: { orgId }
        });
        if (existing && existing.length > 0) {
            logger.debug(`Attempting to update organization`, txID);
            await dbModels.DB.Organizations.update(organization, { where: { orgId } });
            return { status: 200, message: "Updated organization successfully" };
        }
        logger.debug(`Organization not found`, txID);
        return { status: 400, message: `Organization not found: ${orgId}` };
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB update Error: ${error.message}` };
        throw err;
    }
};

exports.delete = async (txID, orgId) => {
    try {
        const result = await dbModels.DB.Organizations.findByPk(orgId);
        if (!result) {
            logger.debug(`Organization not found`, txID);
            return { status: 404, message: `Organization not found: ${orgId}` };
        }
        await result.destroy();
        return { status: 200, message: `Successfully deleted ${orgId}` };
    } catch (error) {
        logger.error(`Error dbOperation: ${error}`, txID);
        const err = { status: 500, message: `DB delete Error: ${error.message}` };
        throw err;
    }
};
