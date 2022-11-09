/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

exports.HEALTHPASS_ADMIN_SCOPE = 'healthpass.admin';

exports.APP_ID_ROLES = {
    HEALTHPASS_ADMIN: 'healthpass.admin',
    REGISTRATION_ADMIN: 'regadmin',
    TEST_ADMIN: 'testadmin',
    DATA_ADMIN: 'dataadmin',
    FILE_ADMIN: 'fileadmin', // auth strategy that encompasses regadmin and testadmin scopes,
    DES_PREFIX: "des"
};

exports.WILDCARD_USER_AUTHORIZE = '*';

exports.REQUEST_HEADERS = {
    ISSUER_ID: 'x-hpass-issuer-id',
    TRANSACTION_ID: 'x-hpass-txn-id',
};

exports.ERROR_CODES = {
    TIMEOUT: 'ECONNABORTED',
    NOTFOUND: 'ENOENT',
};

exports.VACCINE_SCHEMA_IDS = ['ghp-vaccination-credential', 'clx-vaccination-credential'];

// white list consumers
exports.WHITELIST = ['http://localhost*', 'https://localhost*',
    'https://*.acme.com', 'https://*.mybluemix.net'];

exports.CLIENTS = {
    CHS: "CHS",
    TRIRIGA: "TRIRIGA",
    SG: "SG",
    DEFAULT: "DEFAULT"
};

exports.FILTER = {
    CHS: {
        attributes: ['email', 'firstName', 'lastName', 'cvxCode', 'marketingAuthorizationHolder',
            'dateOfVaccination', 'vaccineStatus'],
        employeeType: ['employee']
    },
    DEFAULT: {
        attributes: ['email', 'firstName', 'lastName', 'cvxCode', 'marketingAuthorizationHolder',
            'dateOfVaccination', 'vaccineStatus', ['fileName', 'source']],
        headers: ['email', 'firstName', 'lastName', 'cvxCode', 'marketingAuthorizationHolder',
            'dateOfVaccination', 'vaccineStatus', 'source'],
        employeeType: ['']
    },
    SG: {
        attributes: ['email', ['firstName', 'name'], 'cvxCode', 'marketingAuthorizationHolder',
            'dateOfVaccination', 'vaccineStatus'],
        headers: ['email', 'name', 'cvxCode', 'marketingAuthorizationHolder',
            'dateOfVaccination', 'vaccineStatus'],
        employeeType: ['employee']
    },
    TRIRIGA: {
        attributes: ['email', 'vaccineStatus'],
        employeeType: ['employee', 'contractor']
    },
    VERIFY: {
        attributes: ['email', 'vaccineStatus']
    }
};

exports.JOB_STATUS = {
    START: 'start',
    RUNNING: 'running',
    DONE: 'done',
};

exports.SENT_STATUS = {
    YES: 'yes',
    NO: 'no'
};

exports.CREDENTIAL_STATUS = {
    VALID: 'valid'
};

exports.EMPLOYEE_TYPE = {
    EMPLOYEE: 'employee'
};

exports.JOB_ID = {
    PROCESS_CRON: 'process',
    PUBLISH_CRON: 'publish',
    PERSIST_CRON: 'persist',
    CLEANUP_CRON: 'cleanup'
};

exports.BOX_UPLOAD_TYPE = {
    FILE_CONTENTS: 'fileContents'
};

exports.CRED_TYPE = {
    IDHP: 'IDHP',
    SHC: 'SHC',
    META: 'metadata',
    ID: 'ID'
};

exports.CRED_INDEX = {
    0: 'consentType',
    1: 'id',
    2: 'vaccination',
    3: 'vaccination metadata'
};

exports.IBM_ORGS = ['ibm-rto', 'ibm-crto'];
exports.EXCLUDE_IBM_ORGS = ['ibm-rto', 'ibm-crto', 'ibm-rto-sg'];
