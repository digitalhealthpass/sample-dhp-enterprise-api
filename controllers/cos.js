/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
* 
*/

const constants = require('../helpers/constants');
const CosHelper = require('../helpers/cos-helper');
const Logger = require('../config/logger');
const { logAndSendErrorResponse } = require('../helpers/utils');
const organizationHelper = require('../helpers/organization-helper');

const logger = new Logger('cos-controller');


// Entry point for GET /cos/:entity
exports.getCOSFileNames = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.info('Entering GET /cos/:entity controller', txID);

    // Make sure entity is defined in input
    if (!req.params.entity) {
        return res.status(400).json({
            error: {
                message: 'Missing organization',
            },
        });
    }
    const orgId = req.params.entity;
    const {maxKeys} = req.query;

    try {
        const orgRes = await organizationHelper.getOrganization(txID, orgId);
        if (!orgRes) {
            return res.status(400).json({
                error: {
                    message: `Invalid organization: ${orgId}`,
                },
            });
        }

        const cosHelper = CosHelper.getInstance(txID);
        const fileList = await cosHelper.getAllFiles(txID, orgId, maxKeys);
    
        const successMsg = `Successfully retrieved COS file names for organization ${orgId}`;
        logger.response(200, successMsg, txID);
        return res.status(200).json({
            message: successMsg,
            payload: fileList,
        });

    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'getCOSFileNames');
    }
};

// Entry point for GET /cos/:entity/:filename
exports.getCOSFile = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.info('Entering GET /cos/:entity/:filename controller', txID);

    // Make sure entity is defined in input
    if (!req.params.entity) {
        return res.status(400).json({
            error: {
                message: 'Missing organization',
            },
        });
    }

    // Make sure entity is defined in input
    if (!req.params.filename) {
        return res.status(400).json({
            error: {
                message: 'Missing filename',
            },
        });
    }

    const orgId = req.params.entity;
    const { filename } = req.params;

    try {
        const orgRes = await organizationHelper.getOrganization(txID, orgId);
        if (!orgRes) {
            return res.status(400).json({
                error: {
                    message: `Invalid organization: ${orgId}`,
                },
            });
        }

        const cosHelper = CosHelper.getInstance(txID);
        const fileContent = await cosHelper.getFile(txID, orgId, filename);

    
        logger.response(200, `Successfully retrieved COS file ${filename} for organization ${orgId}`, txID);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        return res.status(200).send(fileContent);
    } catch (err) {
        const errMsg = `Error retrieving COS file ${filename} for organization ${orgId} - ${err.message}`;
        logger.error(errMsg, txID);
        return res.status(400).json({ 
            error: {
                message: errMsg
            }
        });
    }
};

// Entry point for DELETE /cos/:entity/:filename
exports.deleteCOSFile = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.info('Entering DELETE /cos/:entity/:filename controller', txID);

    // Make sure entity is defined in input
    if (!req.params.entity) {
        return res.status(400).json({
            error: {
                message: 'Missing organization',
            },
        });
    }

    // Make sure entity is defined in input
    if (!req.params.filename) {
        return res.status(400).json({
            error: {
                message: 'Missing filename',
            },
        });
    }

    const orgId = req.params.entity;
    const { filename } = req.params;

    try {
        const orgRes = await organizationHelper.getOrganization(txID, orgId);
        if (!orgRes) {
            return res.status(400).json({
                error: {
                    message: `Invalid organization: ${orgId}`,
                },
            });
        }

        const cosHelper = CosHelper.getInstance(txID);

        try {
            await cosHelper.deleteFile(txID, orgId, filename);
        } catch (error) {
            logger.error(error.message, txID);
            return res.status(error.statusCode).send({
                message: error.message,
            });
        }
    
        const successMsg = `Successfully deleted COS file ${filename} for organization ${orgId}`;
        logger.response(200, successMsg, txID);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        return res.status(200).send({
            message: successMsg,
        });
    } catch (err) {
        const errMsg = `Error deleting COS file ${filename} - ${err.message}`;
        logger.error(errMsg, txID);
        return res.status(400).json({ 
            error: {
                message: errMsg
            }
        });
    }
};