/* eslint-disable complexity */
/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */
// TODO: may not need this helper file after the release - including it now for backward compatible
const jslt = require("jslt");
const desHelper = require('./des-helper');
const verifierHelper = require('./verifier-sdk-helper');
const daoHolder = require('../data-access/holderCredentials');
const Logger = require('../config/logger');
const constants = require("./constants");

const logger = new Logger('cred-process-helper');

const getCredentialType = (cred) => {
    return cred.credentialSubject && cred.credentialSubject.type ? cred.credentialSubject.type : 'unknown';
};

const isVaccineCredentials = (cred) => {
    // TODO : Validate 
    return constants.VACCINE_SCHEMA_IDS.includes(cred.credentialSchema.id.split(';')[1].split('=')[1]);
};

const prepareMapperId = (schemaId) => {
    return (schemaId.split(';')[1].split('=')[1]) + (schemaId.split(';')[2].split('=')[1]);
};

const getMapper = (cred, mappers, credType) => {
    let mapperId;
    if(credType === constants.CRED_TYPE.IDHP){
        mapperId = prepareMapperId(cred.credentialSchema.id);
    }else if(credType === constants.CRED_TYPE.SHC){
        // TODO need to understand different VCI credentials
        mapperId = "shcmapper";
    }
    return mappers[mapperId];
};

const addHolderCredentials = async (txID, orgId, credentials, fileName, orgConfig) => {
    let holderCreds = {};
    holderCreds.orgId = orgId;
    holderCreds.fileName = fileName;

    // Org level config param
    holderCreds.employeeType = orgConfig.employeeType || '';

    // default setting to valid becuase DES already handles the verifaction
    holderCreds.vaccineStatus = constants.CREDENTIAL_STATUS.VALID;
    holderCreds.sentStatusChs = constants.SENT_STATUS.NO;
    holderCreds.sentStatusTririga = constants.SENT_STATUS.NO;

    const idMapper = getMapper(credentials[1], orgConfig.mappers, constants.CRED_TYPE.IDHP);
    const vaccineMapper = getMapper(credentials[2].decrypted, 
        orgConfig.mappers, credentials[2].type);
    if (!idMapper) {
        logger.warn("No Id mapper found : cannot process", txID);
        const err = { status: 404, message: `No Id mapper found : cannot process` };
        throw err;
    }
    if (!vaccineMapper) {
        logger.warn("No vaccine mapper found : cannot process", txID);
        const err = { status: 404, message: `No vaccine mapper found : cannot process` };
        throw err;
    }
    holderCreds = {
        ...holderCreds,
        ...jslt.transform(credentials[1], idMapper)
    };
    holderCreds = {
        ...holderCreds,
        ...jslt.transform(credentials[2].decrypted, vaccineMapper)
    };
   
    // eslint-disable-next-line prefer-destructuring
    holderCreds.consentReceipt = credentials[0];
    // eslint-disable-next-line prefer-destructuring
    holderCreds.idCredentials = credentials[1];
    holderCreds.vaccinationCredentials = credentials[2].source;

    // find CVX code, dateOfVaccination from entity 1 or 2
    holderCreds.cvxCode = holderCreds.cvxCode || holderCreds.cvxCode2 || holderCreds.cvxCode1;
    holderCreds.dateOfVaccination = holderCreds.dateOfVaccination || holderCreds.dateOfVaccination2 
        || holderCreds.dateOfVaccination1;

    // delete additional attributes
    const props = ['cvxCode1', 'cvxCode2', 'dateOfVaccination1', 'dateOfVaccination2'];
    props.forEach(prop => delete holderCreds[prop]);

    if((!holderCreds.marketingAuthorizationHolder)){
        holderCreds.marketingAuthorizationHolder = orgConfig.manufacturer[holderCreds.cvxCode] || '';
    }

    const holderCredsRes = await daoHolder.addCredentials(txID, holderCreds);
    logger.response(holderCredsRes.status, `${holderCredsRes.message}`, txID);
};

const getLatestCredentials = (currentCredentials, latestCredentials) => {
    if (latestCredentials && (latestCredentials.createDate > currentCredentials.createDate)) {
        return latestCredentials;
    }
    return currentCredentials;
};


const prepareVaccineCredentials = async (txID, cred, latestCredentials, extracted) => {
    const {credType} = extracted;
    const currentCredentials = {};
    currentCredentials.source = cred.payload || cred;
    currentCredentials.type = credType;

    if(credType === constants.CRED_TYPE.IDHP && isVaccineCredentials(cred)){
        currentCredentials.decrypted = extracted.credential;
        currentCredentials.createDate = new Date(extracted.credential.proof.created);
    } 
    else if(credType === constants.CRED_TYPE.SHC){
        currentCredentials.decrypted = extracted.credential;
        currentCredentials.createDate = new Date(extracted.credential.nbf*1000);
    }else{
        logger.warn(`Unsupported credential type ${credType}`, txID);
        return;
    }
    // eslint-disable-next-line consistent-return
    return getLatestCredentials(currentCredentials, latestCredentials);
};

// eslint-disable-next-line complexity
const prepareData = async (txID, credentialsData, fileName) => {

    const credentials = [];
    let extractStatus = true;
    let extracted;

    if (credentialsData.length < 3) {
        logger.warn(`Deleting COS entry : found less than 3 credentials`, txID);
        return [undefined, extractStatus];
    }
    const last = credentialsData[credentialsData.length - 1];
    if('metadata' in last){
        credentialsData.pop();
    }

    for (let i = 0; i < credentialsData.length; i += 1) {
        const cred = credentialsData[i];
        if ((typeof cred === 'object') && ("consentType" in cred)) {
            credentials[0] = cred;
        } else if ((typeof cred === 'object') && (getCredentialType(cred) === "id")) {
            credentials[1] = cred;
        } else {
            // eslint-disable-next-line no-await-in-loop
            extracted = await verifierHelper.extract(cred);
            if(!extracted.success){
                if (extracted.error) {
                    logger.error(`unable to decrypt/extract credential: ${extracted.error}`, txID);
                } else {
                    logger.warn(`unable to decrypt/extract credential: ${extracted.message}`, txID);
                }
                extractStatus = false;
            }
            // eslint-disable-next-line no-await-in-loop
            credentials[2] = await prepareVaccineCredentials(txID, cred, credentials[2], extracted) || credentials[2];
        }
    }

    // Check any credentials are missing when user uploaded credentials array.
    for (let i = 0; i < credentials.length;  i += 1) {
        if (!credentials[i]) {
            logger.warn(`Missing ${constants.CRED_INDEX[i]} credentials in ${fileName}`, txID);
            return [undefined, extractStatus];
        }
    }

    return [credentials, extractStatus];  
};

const processFile = async (txID, token, orgId, orgConfig, file, credentialsData) => {
    logger.debug(`Processing file ${file}`, txID);

    const [credentials, extractStatus] = await prepareData(txID, credentialsData, file);

    if(!extractStatus && !credentials){
        logger.warn(`Unable to extract credentials ${file}`, txID);
        return false;
    }
    
    if (!credentials) {
        logger.warn(`Unable to process credentials ${file}`, txID);
        await desHelper.deleteCOSFile(txID, token, orgId, file);
        return false;
    }

    try {
        await addHolderCredentials(txID, orgId, credentials, file, orgConfig);
    } catch(err) {
        logger.warn(`Unable to add holder credentials ${file}: ${err.message}`, txID);
        return false;
    }

    try {
        await desHelper.deleteCOSFile(txID, token, orgId, file);
    } catch(err) {
        logger.warn(`Unable to delete COS file ${file}: ${err.message}`, txID);
        return false;
    }
    return true;
};

module.exports = {
    prepareData,
    getCredentialType,
    addHolderCredentials,
    processFile
};
