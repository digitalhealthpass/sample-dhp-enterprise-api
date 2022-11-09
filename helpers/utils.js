/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const constants = require("./constants");
const Logger = require('../config/logger');

const logger = new Logger('utils');

exports.logAndSendErrorResponse = (txID, res, error, baseMsg) => {
    const { errorStatus, errorMsg } = this.getErrorInfo(txID, error);
    const message = `Failed to ${baseMsg} :: ${errorMsg}`;

    logger.errorResponse(errorStatus, message, txID);
    return res.status(errorStatus).json({
        error: {
            txID,
            message,
        },
    });
};

exports.validateReqBody = (txID, reqBody, requiredFields) => {
    let errMsg = '';
    for (let i = 0; i < requiredFields.length; i += 1) {
        const field = requiredFields[i];
        const fieldValue = reqBody[field];

        if (!fieldValue) {
            errMsg = `Missing required variable in request body: ${field}`;
            logger.error(`Invalid request body: ${errMsg}`, txID);
            break;
        } else if (typeof fieldValue === 'string' && !fieldValue.trim()) {
            errMsg = `Request body field cannot be empty: ${field}`;
            logger.error(`Invalid request body: ${errMsg}`, txID);
            break;
        }
    }
    return errMsg;
};

exports.validateRequiredField = (fieldValue, field) => {
    let errMsg = '';
    if (!fieldValue) {
        errMsg = `Missing required param: ${field}`;
    } else if (typeof fieldValue === 'string' && !fieldValue.trim()) {
        errMsg = `Required param cannot be empty: ${field}`;
    }

    return errMsg;
};

exports.isEmpty = (fieldValue) => {
    if (!fieldValue) {
        return true;
    } if (typeof fieldValue === 'string' && !fieldValue.trim()) {
        return true;
    }
    return false;
};
// eslint-disable-next-line complexity
exports.getErrorInfo = (txID, error) => {
    let errorStatus;
    let errorMsg = '';

    if (error.code && error.code === constants.ERROR_CODES.TIMEOUT) {
        errorStatus = 500;
        errorMsg = `Connection timed out: ${error.message}`;
    } else if (error.response) {
        // server received request and responded with error (4xx, 5xx)
        errorStatus = error.response.status;
        const errorResponse = error.response.data;

        // some components wrap their errors differently
        if (typeof errorResponse === 'object') {
            if (errorResponse.error && errorResponse.error.message) {
                errorMsg = errorResponse.error.message;
            } else {
                errorMsg = errorResponse.message || errorResponse.detail || `${error}`;
            }
        } else if (typeof errorResponse === 'string') {
            errorMsg = errorResponse;
        }
    } else if (error.request && error.request.res) {
        // server never received request
        errorStatus = error.request.res.statusCode;
        errorMsg = error.request.res.statusMessage;
    } else if (error.statusCode && error.message) {
        errorStatus = error.statusCode;
        errorMsg = error.message;
    } else {
        logger.error(error, txID);
        errorStatus = 500;
        errorMsg = `${error}` || 'Server processing error';
    }

    return { errorStatus, errorMsg };
};

exports.setErrorPayload = (message) => {
    return {
        error: {
            message
        }
    };
};

exports.setSuccessPayload = (message, payload) => {
    return { message, payload };
};
