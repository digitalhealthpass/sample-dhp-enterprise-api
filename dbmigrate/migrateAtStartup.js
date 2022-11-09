/* eslint-disable max-len */
/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable no-console */
const childProcess = require('child_process');
const { join } = require('path');
const fs = require('fs');
const Logger = require('../config/logger');
const { desSchemaName } = require('../models/dbmodels');
const config = require('../config/app/config.json');

const logger = new Logger('dbMigrateAtStartup');

const logStatus = (message) => {
    logger.info(`\nFLYWAY MigrationCheck output: ${message}`);
};

const fwDir = '/usr/local/bin/flyway';

const migrateAtStartup = () => {
    try {
        fs.statSync(fwDir);

        const migrationDir = join(__dirname, 'sql');
        logger.info(`Running Flyway files at: ${migrationDir}`);
        const stdout = childProcess.execSync(
            `flyway -user=${process.env.POSTGRES_USER} \\
            -password=${process.env.POSTGRES_USERPWD} \\
            -url=jdbc:postgresql://${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB_NAME} \\
            -locations=filesystem:${migrationDir} \\
            -schemas=${desSchemaName} \\
            -baselineOnMigrate=${config.upgradeDBOnStartup} \\
            migrate`
        );
        logStatus(stdout.toString('utf8'));
    } catch (err) {
        if (err.message.includes('stat')) {
            logger.info(`Skipping. Flyway CLI not available at: ${fwDir}`);
            return;
        }
        logger.error(`Error during FLYWAY MigrationCheck: ${err.message}`);
        throw err;
    }
};

module.exports = migrateAtStartup;
