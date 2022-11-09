/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
* 
*/
const Logger = require('../config/logger');

const logger = new Logger('credntial-controller');
const constants = require('../helpers/constants');
const organizationHelper = require('../helpers/organization-helper');
const dataHelper = require('../helpers/data-helper');
const { validateRequiredField, logAndSendErrorResponse } = require('../helpers/utils');
const verifyHelper = require('../helpers/verifier-sdk-helper');

exports.verify = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];

    try {

        const errMsg = validateRequiredField(req.body, ['email', 'orgId']);
        if (errMsg) {
            return logAndSendErrorResponse(txID, res, { statusCode: 400, message: errMsg }, `verifyCredentials`);
        }

        const { orgId } = req.body;
        const { email } = req.body;

        const org = await organizationHelper.getOrganization(txID, orgId);

        if (!org.payload || org.payload.length < 1) {
            logger.response(400, errMsg, txID, req);
            return res.status(400).json({
                error: {
                    message: "OrgId not found",
                },
            });
        }
        const result = await dataHelper.getHolderCredentialByEmail(txID, email, orgId);
        if (result) {
            const verifyRes = await verifyHelper.verify(result.vaccinationCredentials);
            logger.response(200, verifyRes.message, txID);
            return res.status(200).json({
                message: verifyRes.message
            });
        }
        return res.status(404).json({
            error: {
                message: "Credentials are not found"
            }
        });
    } catch (err) {
        return logAndSendErrorResponse(txID, res, err, 'verify credentials');
    }

};

