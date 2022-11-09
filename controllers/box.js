/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const constants = require('../helpers/constants');
const utils = require('../helpers/utils');
const boxHelper = require('../helpers/box-helper');
const Logger = require('../config/logger');

const logger = new Logger('box-controller');

// Entry point for GET /box/folders/{folderId}
module.exports.getFolder = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.debug('Entering GET /box/folders/{folderId} controller', txID);

    try {
        const ret = await boxHelper.getFolder(txID, req.params.folderId);
        res.status(200).json(utils.setSuccessPayload('Successfully retrieved folder contents from Box', ret));
    } catch (err) {
        logger.error(err, txID);
        const errorInfo = boxHelper.getErrorInfo(err);
        res.status(errorInfo.errorStatus).json(utils.setErrorPayload(errorInfo.errorMsg));
    }
};

// Entry point for POST /box/folders/{folderId}/files
module.exports.uploadFile = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.debug('Entering POST /box/folders/{folderId}/files controller', txID);

    const errorMsg = utils.validateReqBody(txID, req.body, ['srcType', 'source', 'dstFile']);
    if (errorMsg) {
        res.status(400).json(utils.setErrorPayload(errorMsg));
    } else if (!['filePath', 'fileContents'].includes(req.body.srcType)) {
        res.status(400).json(utils.setErrorPayload('Invalid srcType, must be filePath or fileContents'));
    } else {
        try {
            const ret = await boxHelper.uploadFile(txID, 
                req.body.srcType, req.body.source, req.body.dstFile, req.params.folderId);
            res.status(200).json(utils.setSuccessPayload('Successfully uploaded file to Box', ret));
        } catch (err) {
            logger.error(err, txID);
            const errorInfo = boxHelper.getErrorInfo(err);
            res.status(errorInfo.errorStatus).json(utils.setErrorPayload(errorInfo.errorMsg));
        }
    }
};

// Entry point for DELETE /box/files/{fileId}
module.exports.deleteFile = async (req, res) => {
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];
    logger.debug('Entering DELETE /box/files/{fileId} controller', txID);

    try {
        await boxHelper.deleteFile(txID, req.params.fileId);
        res.status(200).json({ message: 'Successfully deleted file from Box' });
    } catch (err) {
        logger.error(err, txID);
        const errorInfo = boxHelper.getErrorInfo(err);
        res.status(errorInfo.errorStatus).json(utils.setErrorPayload(errorInfo.errorMsg));
    }
};
