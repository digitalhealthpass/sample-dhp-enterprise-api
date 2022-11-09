/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { DataTypes } = require('sequelize');
const dbmodels = require('./dbmodels');

// eslint-disable-next-line max-lines-per-function
const init = (sequelize) => {

    const HolderCredentials = sequelize.define('HolderCredentials', {
        // Model attributes 
        holderCredentialsId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        email: {
            type: DataTypes.STRING(64),
            allowNull: false,
            primaryKey: true
        },
        orgId: {
            type: DataTypes.STRING(30),
            allowNull: false,
            primaryKey: true
        },
        fileName: {
            type: DataTypes.STRING(64),
        },
        firstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        cvxCode: {
            type: DataTypes.STRING(32)
        },
        marketingAuthorizationHolder: {
            type: DataTypes.STRING(100)
        },
        employeeType: {
            type: DataTypes.STRING(15),
        },
        dateOfVaccination :{
            type: DataTypes.DATEONLY
        },
        vaccineStatus :{
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        idCredentials: {
            type: DataTypes.JSON,
        },
        consentReceipt: {
            type: DataTypes.JSON,
        },
        vaccinationCredentials: {
            type: DataTypes.JSON,
        },
        sentStatusChs :{
            type: DataTypes.STRING(5),
            allowNull: false,
        },
        sentStatusTririga :{
            type: DataTypes.STRING(5),
            allowNull: false,
        }
    }, {
        schema: dbmodels.desSchemaName,
        tableName: 'holder_credentials'

    });

    const Jobs = sequelize.define('Jobs', {
        // Model attributes 
        jobId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            primaryKey: true
        },
        orgId: {
            type: DataTypes.STRING(30),
            allowNull: false,
            primaryKey: true
        },
        status: {
            type: DataTypes.STRING(10),
            allowNull: false
        }
    }, {
        schema: dbmodels.desSchemaName,
        tableName: 'jobs'
    });

    const Organizations = sequelize.define('Organizations', {
        // Model attributes 
        orgId: {
            type: DataTypes.STRING(30),
            allowNull: false,
            primaryKey: true
        },
        config: {
            type: DataTypes.JSON
        }
    }, {
        schema: dbmodels.desSchemaName,
        tableName: 'organizations'
    });
   
    const models = {HolderCredentials, Jobs, Organizations};
    return models;
};

module.exports = {
    init,
};
