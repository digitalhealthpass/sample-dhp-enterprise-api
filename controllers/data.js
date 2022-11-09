/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */
const Logger = require('../config/logger');
const dataHelper = require('../helpers/data-helper');
const partnerHelper = require('../helpers/partner-data-helper');
const organizationHelper = require('../helpers/organization-helper');

const logger = new Logger('data-controller');
const constants = require('../helpers/constants');
const { logAndSendErrorResponse } = require('../helpers/utils');

exports.persist = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    const token = req.headers.authorization;
    logger.info('Entering POST /data/persist controller', txID);

    const orgId = req.params.entity;

    try {
        logger.debug(`Attempting to persist report`, txID);
        const orgRes = await organizationHelper.getOrganization(txID, orgId);
        if (orgRes.status !== 200) {
            logger.response(orgRes.status, `${orgRes.message}`, txID, req);
            return res.status(orgRes.status).json({
                error: {
                    message: orgRes.message,
                },
            });
        }
        const result = await dataHelper.persistAllData(txID, token, orgRes.payload.orgId, orgRes.payload.config);

        if (result.status !== 201) {
            logger.response(400, "Unable to persist data", txID, req);
            return res.status(400).json({
                error: {
                    message: "Unable to persist data",
                },
            });
        }
        logger.response(201, `${result.message}`, txID);
        return res.status(201).json({ message: `${result.message}`});

    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'persistData');
    }
};

exports.persistPartnerData = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.info('Entering POST /:entity/partners/persist controller', txID);
    const { entity, partnerId } = req.params;
    const token = req.headers.authorization;

    try {
        logger.debug(`Attempting to persist report for org ${entity} from partner ${partnerId}`, txID);
        const orgRes = await organizationHelper.getOrganization(txID, entity);
        if (orgRes.status !== 200) {
            logger.response(orgRes.status, `${orgRes.message}`, txID, req);
            return res.status(orgRes.status).json({
                error: {
                    message: orgRes.message,
                },
            });
        }
        const {partners} = orgRes.payload.config;
        // eslint-disable-next-line no-restricted-syntax
        for (const partner of partners) {
            if(partner.id === partnerId){
                // eslint-disable-next-line no-await-in-loop
                const result = await partnerHelper.persistAllPartnerData(txID, token, entity, partner);
                if (result.status !== 201) {
                    logger.response(400, "Unable to persist partner data", txID, req);
                    return res.status(400).json({
                        error: {
                            message: "Unable to persist partner data",
                        },
                    });
                }
                logger.response(201, `updated partner data successfully`, txID);
                return res.status(201).json({ message: `updated partner data successfully`});
            }
            logger.response(400, `${partnerId} partnerId is not defined for the org ${entity}`, txID, req);
            return res.status(400).json({
                error: {
                    message: `${partnerId} partnerId is not defined for the org ${entity}`,
                },
            });
            
        }
        return null;
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'persistPartnerdata');
    }
};


exports.publishReport = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];

    try {
        // TODO to validate client
        const orgId = req.params.entity;
        const client = req.params.client || constants.CLIENTS.DEFAULT;
        const folder = req.params.folder || '';
        logger.debug(`Attempting to publish report`, txID);
        const clientPrefix = client.substring(0, 3).toLowerCase();
        const jobId = `${clientPrefix}-${constants.JOB_ID.PUBLISH_CRON}`;
        const result = await dataHelper.publishReport(txID, orgId, client, folder, jobId);
        if (result.status !== 201) {
            logger.response(400, "Unable to publish report", txID, req);
            return res.status(400).json({
                error: {
                    message: "Unable to publish report",
                },
            });
        }
        logger.response(201, `${result.message}`, txID);
        return res.status(201).json({ message: `${result.message}`});

    } catch (error) {
        return logAndSendErrorResponse(txID, res, error, 'publishReport');
    }
};

exports.getReport = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];

    try {
        // TODO to validate client
        const orgId = req.params.entity;
        const { client } = req.params;
        logger.debug(`Attempting to get report`, txID);
        const results = await dataHelper.getReport(txID, orgId, client);
        return res.status(200).json({
            message: "Successfully retrieved report",
            payload: results
        });

    } catch (error) {
        // eslint-disable-next-line max-len
        return logAndSendErrorResponse(txID, res, { statusCode: error.statusCode, message: error.message }, 'getReport');
    }
};
