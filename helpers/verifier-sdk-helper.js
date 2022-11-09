/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
* 
*/
const { CredentialVerifierBuilder } = require('dhp-verify-nodejs-lib');

const verifierBuilder = new CredentialVerifierBuilder()
    .setVerifierCredential({
        id: 'Enterprise',
        entityId: "enterprise-api",
        credentialSubject: {
            useAppId: true,
            configId: process.env.VERIFIER_CONFIG_ID,
            organizationId: "Enterprise",
        }
    }).setReturnCredential(true);


exports.extract = async (credential) => {
    return verifierBuilder
        .setCredential(credential)
        .build()
        .extractCredential();
};

exports.verify = async (credential) => {
    return verifierBuilder
        .setCredential(credential)
        .build()
        .verify();
};

exports.initVerifierBuilder = async () => {
    return verifierBuilder.init();
};
