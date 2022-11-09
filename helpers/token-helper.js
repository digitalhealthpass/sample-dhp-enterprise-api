/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
* 
*/
const helper = require('./app-id-helper');
// TODO : move to config 
const tokenBeforeTime = 5 * 60 * 1000; ;     // 5 min in ms
const Logger = require('../config/logger');

const logger = new Logger('token-helper');

const desUser = process.env.DES_USERNAME;
const desPassword = process.env.DES_PASSWORD;

class tokenCache {
    constructor() {
        this.tokenData = null;
        this.timer = null;
    }

    async getToken() {
        if (this.tokenData) {
            if (this.tokenData.expires < Date.now()) {
                return (await this.getNewToken()).token;
            } 
            return this.tokenData.token;
            
        } 
        return (await this.getNewToken()).token;
        
    }

    async getNewToken() {
        try{
            const token = await helper.loginAppID(desUser, desPassword);
            const tokenExpiration = token.expires_in * 1000;
            this.scheduleTokenRefresh(tokenExpiration - tokenBeforeTime);
            this.tokenData = {
                token,
                expires: Date.now() + tokenExpiration
            };
        }catch(error){
            logger.error(`AppIDLogin call error ${error.message}`);
            this.tokenData = null;
            throw error;
        }
        return this.tokenData;
    }

    scheduleTokenRefresh(t) {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            logger.info("refreshing APPID token");
            this.getNewToken().catch(err => {
                logger.warn("Error updating token before expiration", err);
            });
            this.timer = null;
        }, t);
    }

}
let instance;
const getCache = () => {
    if (!instance) {
        // eslint-disable-next-line new-cap
        instance = new tokenCache();
    }
    return instance;
};

module.exports = getCache;
