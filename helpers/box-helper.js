/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const fs = require('fs');
const BoxSdk = require('box-node-sdk');

const constants = require('./constants');
const utils = require('./utils');
const Logger = require('../config/logger');
 
const logger = new Logger('box-helper');

/* For use with developer token only
const sdk = new BoxSdk({
    clientID: process.env.BOX_CLIENT_ID,
    clientSecret: process.env.BOX_CLIENT_SECRET,
});
*/

// The following configuration is generated automagically by the Box UI.  Seems easy enough, but to get
// to that point requires a bit of work:
// 1. Go to https://ibm.ent.box.com/developers/console and log in (functional ID?)
// 2. Select 'Create New App'
// 3. Select 'Custom App'
// 4. Select 'Server Authentication (with JWT)', enter app name and select 'Create App'
// 5. On Configuration tab, make sure 'App Access Only' is selected under 'App Access Level', select
//    'Write all files and folders stored in Box' under 'Application Scopes' and select 'Save Changes'
// 6. Submit the app for approval
//
// After approval is granted:
// 1. On Configuration tab, select 'Generate a Public/Private Keypair' to generate configuration file
// 2. Set these environment variables based on contents of the configuration file:
//    BOX_CLIENT_ID,BOX_CLIENT_SECRET,BOX_PUBLIC_KEY_ID,BOX_PRIVATE_KEY,BOX_PASSPHRASE,BOX_ENTERPRISE_ID
// 3. On 'General Settings' tab, note Service Account ID - this email will need to be given Editor access
//    to all folders that will receive uploaded files from the app

const config = {
    boxAppSettings: {
        clientID: process.env.BOX_CLIENT_ID,
        clientSecret: process.env.BOX_CLIENT_SECRET,
        appAuth: {
            publicKeyID: process.env.BOX_PUBLIC_KEY_ID,
            privateKey: process.env.BOX_PRIVATE_KEY,
            passphrase: process.env.BOX_PASSPHRASE,
        }
    },
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
};

const sdk = BoxSdk.getPreconfiguredInstance(config);
// logger.debug(JSON.stringify(sdk))

// Return error information taking into account Box errors
// eslint-disable-next-line complexity
function getErrorInfo(err) {
    let errorStatus;
    let errorMsg;

    if (err.response && err.response.body) {
        // Box-specific error
        const { body } = err.response;
        errorStatus = typeof body.status !== 'undefined' ? body.status : 500;
        if (typeof body.message !== 'undefined')
            errorMsg = `Box error: ${body.message}`;
        else if (typeof body.error !== 'undefined')
            errorMsg = `Box error: ${body.error}`;
        else 
            errorMsg = 'Box error: Internal error';
    } else if (err.statusCode) {
        errorStatus = err.statusCode;
        errorMsg = 'Internal Box API error';
    } else if (err.code && err.code === constants.ERROR_CODES.NOTFOUND) {
        // fs-specific error
        errorStatus = 404;
        errorMsg = `Path not found: ${err.path}`;
    } else {
        // Fall back to default
        const errorObj  = utils.getErrorInfo(err);
        errorStatus = errorObj.errorStatus;
        errorMsg = errorObj.errorMsg;
    }
    return { errorStatus, errorMsg };
}

/*
const whoAmI = async (txID) => {
    logger.debug(`Inside whoAmI())`, txID);
    let retVal = null;

    // const client = await sdk.getBasicClient(process.env.BOX_API_TOKEN); developer token
    const client = sdk.getAppAuthClient('enterprise');
    // logger.debug(client); // REMOVE

    await client.users.get(client.CURRENT_USER_ID)
        .then(currentUser => {
            retVal = currentUser;
        })
        .catch(err => {
            logger.error('Got an error with box.users.get!', txID);
            logger.error(err);
            throw err;
        });

    return retVal;
}
*/

const getFolder = async (txID, folderId) => {
    logger.debug(`Inside getFolder(${folderId})`, txID);
    const retVal = [];

    try {
        // const client = await sdk.getBasicClient(process.env.BOX_API_TOKEN); developer token
        const client = sdk.getAppAuthClient('enterprise');
        // logger.debug(client); // REMOVE

        logger.debug(`Querying Box folder ${folderId} contents`, txID);
        await client.folders.get(folderId)
            .then(folder => { 
                if (folder.item_collection && folder.item_collection.total_count > 0) {
                    for (let i = 0; i < folder.item_collection.total_count; i += 1) {
                        const entry = folder.item_collection.entries[i];
                        logger.info(entry);
                        retVal.push({ name: entry.name, type: entry.type, id: entry.id });
                    }
                }
            })
	        .catch(err => {
                logger.error('Got an error with box.folders.get!', txID);
                logger.error(err);
                throw err;
            });
    } catch (err) {
        logger.error(err);
        throw err;
    }

    logger.debug(retVal); // REMOVE
    return retVal;
};

const uploadFile = async (txID, srcType, src, dstFile, dstFolder) => {
    logger.debug(`Inside uploadFile(${srcType}, ${dstFile}, ${dstFolder})`, txID);
    let retVal = null;

    try {
        // const client = await sdk.getBasicClient(process.env.BOX_API_TOKEN); developer token
        const client = sdk.getAppAuthClient('enterprise');
        // logger.debug(client); // REMOVE

        let toBeUploaded = null;

        if (srcType === 'fileContents') {
            toBeUploaded = src;
        } else if (srcType === 'filePath') {
            try {
                fs.accessSync(src, fs.constants.R_O);
                logger.debug(`Read access checked for ${src}`, txID);
                toBeUploaded = fs.createReadStream(src);
                logger.debug(`Read stream created for ${src}`, txID);
            } catch (err) {
                logger.error(err);
                throw err;
            }
        } else {
            logger.error(`Invalid srcType ${srcType}`);
            throw new Error(`Invalid srcType ${srcType}`);
        }

        logger.debug(`Uploading to Box/${dstFolder}/${dstFile}`, txID);
        await client.files.uploadFile(dstFolder, dstFile, toBeUploaded)    
            .then(file => { 
                // eslint-disable-next-line max-len
                logger.info(`box upload successful with name : ${file.entries[0].name} and size : ${file.entries[0].size}`, txID);
                const ret = {
                    name: file.entries[0].name,
                    id: file.entries[0].id,
                    size: file.entries[0].size,
                    sha1: file.entries[0].sha1,
                };
                retVal = ret;
            })
            .catch(err => {
                logger.error('Got an error with box.files.uploadFile!', txID);
                logger.error(err);
                throw err;
            });
    } catch (err) {
        logger.error(err);
        throw err;
    }

    logger.debug(retVal); // REMOVE
    return retVal;
};

const deleteFile = async (txID, fileId) => {
    logger.debug(`Inside deleteFile(${fileId})`, txID);
    let retVal = false;

    try {
        // const client = await sdk.getBasicClient(process.env.BOX_API_TOKEN); developer token
        const client = sdk.getAppAuthClient('enterprise');
        // logger.debug(client); // REMOVE

        logger.debug(`Deleting Box file ${fileId}`, txID);
        await client.files.delete(fileId)    
            .then(() => { 
                retVal = true;
            })
            .catch(err => {
                logger.error('Got an error with box.files.delete!', txID);
                logger.error(err);
                throw err;
            });
    } catch (err) {
        logger.error(err);
        throw err;
    }

    logger.debug(retVal); // REMOVE
    return retVal;
};

module.exports = {
    getErrorInfo,
    getFolder,
    uploadFile,
    deleteFile,
};
