/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const jwt = require('jsonwebtoken');

const constants = require('../helpers/constants');
const AuthHelper = require('../helpers/auth-helper');

const Logger = require('../config/logger');

const logger = new Logger('user-controller');
const pluggedAuthClient = new AuthHelper();
// eslint-disable-next-line max-len
const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const getJwtToken = (email) => {
    logger.debug('Get local jwt token for login');

    const token = jwt.sign(
        {
            email,
            subject: '1d44cdc1-4b78-4ef7-a5a2-08aabc13619f',
            given_name: 'Tester',
            family_name: 'POC',
            tenant: '14dbfeaa-d6bf-4c10-974c-2c45df4666df',
            name: 'Tester POC',
            organization: 'HealthPassOrg',
        },
        'secretkey$5',
        {
            expiresIn: '8h',
        }
    );

    return {
        access_token: token,
        id_token: token,
        token_type: 'Bearer',
        expires_in: 28800,
        scope: 'test',
    };
};
// eslint-disable-next-line complexity, no-unused-vars
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];

    logger.debug(`Attempting login for ${email}`);

    // Note: keep error message for bad login generic for security - currently same as AppID message
    if (!email || !password || !emailRegex.test(email)) {
        return res.status(400).json({
            error: {
                message: 'The email or password that you entered is incorrect.',
            },
        });
    }
    try {
        const authObject = process.env.AUTH_STRATEGY === 'DEVELOPMENT'
            ? getJwtToken(email)
            : await pluggedAuthClient.login(email, password);
        return res.status(200).json(authObject);
    } catch (error) {
        // only loginAppID() can throw an error
        logger.error(`Failed to login user with AppID: ${error.message}`, txID);
        
        const errStatus = error.status || 500;
        const errMsg = error.message || 'Login failed';
        logger.response(errStatus, errMsg, txID);
        return res.status(errStatus).json({
            error: {
                message: errMsg,
            },
        });
    }
};
