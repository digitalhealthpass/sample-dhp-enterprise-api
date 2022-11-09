/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const passport = require('passport');
const appID = require('ibmcloud-appid');
const userProfileManager = require("ibmcloud-appid").UserProfileManager;
const constants = require('../helpers/constants');

const { APIStrategy } = appID;
const appIDUrl = process.env.APP_ID_URL;

const profileOptions = {
    profilesUrl: process.env.APP_ID_AUTH_SERVER_HOST,
    oauthServerUrl: appIDUrl
};
userProfileManager.init(profileOptions);

passport.use(
    new APIStrategy({
        oauthServerUrl: appIDUrl,
    })
);

const authenticateStandardUser = passport.authenticate(APIStrategy.STRATEGY_NAME, {
    session: false,
});


// TODO will change callback to async
const authenticateAdmins = (req, res, next, org, role, isHealthAdminAllowed) => {
    const scope = `${org}.${role}`;
    passport.authenticate(APIStrategy.STRATEGY_NAME, {
        session: false
    },
    (para0, para1, para2, status) => {
        const errMsg = `User is not authorized for this operation`;
        if (status) {
            // error
            res.status(401).json({
                error: {
                    message: `${errMsg}`
                },
            });
            return;
        }
        // success, begin to check access
        if (req.appIdAuthorizationContext && req.appIdAuthorizationContext.accessTokenPayload) {
            const scopes = req.appIdAuthorizationContext.accessTokenPayload.scope;
            if (scopes.includes(scope)
                    || (isHealthAdminAllowed && scopes.includes(constants.APP_ID_ROLES.HEALTHPASS_ADMIN))) {
                next();
                return;
            }
            const { accessToken } = req.appIdAuthorizationContext;

            // get all attributes
            userProfileManager.getAllAttributes(accessToken).then((attributes) => {
                if (attributes && attributes.org) {
                    const newScope = `${constants.APP_ID_ROLES.DES_PREFIX}.${role}`;
                    if (attributes.org === org && scopes.includes(newScope)) {
                        next();
                        return;
                    }
                }
                res.status(401).json({
                    error: {
                        message: `${errMsg}`
                    },
                });
            });
        } else {
            res.status(401).json({
                error: {
                    message: `${errMsg}`
                },
            });
        }
    })(req, res, next);
};

const authenticateDataAdmin = (req, res, next) => {
    const org = req.body.orgId || req.params.entity.toLowerCase();
    authenticateAdmins(req, res, next, org, constants.APP_ID_ROLES.DATA_ADMIN, true);
};

module.exports = {
    authenticateStandardUser,
    authenticateDataAdmin
};
