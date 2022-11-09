/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const desHelper = require('./des-helper');
const c4Helper = require('./cleared4-helper');
const constants = require("./constants");
const Logger = require('../config/logger');
const organizationHelper = require('./organization-helper');
const daoHolder = require('../data-access/holderCredentials');
const config = require('../config');

const logger = new Logger('partner-data-helper');

const updateHolderStatus = async (txID, orgId, partnerId, user) => {

    const holder = {};
    holder.orgId = orgId;
    holder.email = user.userId;
    holder.fileName = partnerId;

    // Org level config param
    holder.employeeType = '';

    // default setting to valid because DES already handles the validation
    holder.vaccineStatus = user.vaxStatus;
    holder.sentStatusChs = constants.SENT_STATUS.NO;
    holder.sentStatusTririga = constants.SENT_STATUS.NO;

    // C4 is not providing any credentials except status.
    [holder.consentReceipt, holder.idCredentials, holder.vaccinationCredentials] = [{}, {}, {}];

    const tmpArray = user.fullName.split(' ');

    holder.lastName = tmpArray.pop() || '';
    holder.firstName = tmpArray.join(' ') || '';

    holder.marketingAuthorizationHolder = '';
    holder.cvxCode = '';
 
    // holder.dateOfVaccination = moment().format('YYYY-MM-DD hh:mm:ss');
    const holderRes = await daoHolder.addCredentials(txID, holder);
    logger.response(holderRes.status, `${holderRes.message}`, txID);
};

const updateVaccinationStatus = async (txID, orgId, partnerId, partnerKey, userList) => {
    for (let i = 0; i < userList.length; i += 1) {
        try{
            const user = userList[i];
            // Fetch user status
            // eslint-disable-next-line no-await-in-loop
            const userStatuses = await c4Helper.getUsersStatus(txID, partnerKey, [user.userId]);
            user.vaxStatus = userStatuses.data[0].vaxStatus;
            user.userId = user.userId.toLowerCase();
            // eslint-disable-next-line no-await-in-loop
            const res = await daoHolder.getHolderCredentialByEmail(txID, user.userId, orgId);

            // Update only when new user or vaccineStatus changed or not holder upload
            // fileName represents source of the credentials
            if(!res || ((res.vaccineStatus !== user.vaxStatus) && (res.fileName === partnerId))){
                // eslint-disable-next-line no-await-in-loop
                await updateHolderStatus(txID, orgId, partnerId, user);
            }else{
                logger.debug(`No changes to vaccination status`, txID);
            }
        }
        catch (error) {
            logger.error(`Unable to update status ${orgId}: ${error.message}`, txID);
        } 
    }
};

const persistAllPartnerData = async (txID, token, orgId, partner) => {

    try {
        const partnerId = partner.id;
        const partnerRefKey = partner.key;
                
        // Get access token from DES
        const keyRes = await desHelper.getPartnerKey(txID, token, orgId, partnerId, partnerRefKey);
        if (keyRes.status !== 200) {
            const errMsg = `unable to fetch partner key`;
            logger.response(keyRes.status, `Failed to submit : ${errMsg}`, txID);
            return {
                status: 404, message: errMsg
            };
        }
        const partnerKey = keyRes.data.payload[partnerId][partnerRefKey];
        if(!partnerKey){
            const errMsg = `partner key is not defined`;
            logger.response(404, `Failed to submit : ${errMsg}`, txID);
            return {
                status: 404, message: errMsg
            };
        }
        // Fetch all user list 
        const userListRes = await c4Helper.getUsersList(txID, partnerKey);
        const {data} = userListRes;
        const { workers } = config.asyncPool;
        const pendingWorkers = [];
        const startLength = data.length;

        for (let i = 1; i <= workers; i += 1) {
            if ((i === workers) || (data.length <= workers)) {
                pendingWorkers.push(updateVaccinationStatus(txID, orgId, partnerId, partnerKey, data));
                break;
            }
            pendingWorkers.push(updateVaccinationStatus(
                txID, orgId, partnerId, partnerKey, data.splice(0, Math.floor(startLength / workers)))
            );
        }

        await Promise.all(pendingWorkers); 

        return {
            status: 201, message: `finished processing user list of length ${startLength}`
        };
    } catch (error) {
        logger.error(`Unable to persist data for ${orgId}: ${error.message}`, txID);
        return error;
    }
};


const persistAllOrgs = async (txID, token) => {
    try {
        const orgRes = await organizationHelper.getAllOrgs(txID);
        if (orgRes.payload) {
            const orgs = orgRes.payload;
            orgs.map(async (org) => {
                if (org.config.partners) {
                    const {partners} = org.config;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const partner of partners) {
                        // eslint-disable-next-line no-await-in-loop
                        await persistAllPartnerData(txID, token, org.orgId, partner);
                    }
                }
            });
        }
    } catch (error) {
        logger.error(`Unable to fetch all orgs: ${error.message}`, txID);
        throw error;
    }
};

module.exports = {
    persistAllOrgs,
    persistAllPartnerData
};
