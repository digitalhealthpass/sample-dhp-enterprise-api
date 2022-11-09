/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

// eslint-disable-next-line max-len
const { processData, publishDataTRIRIGA, publishDataCHS, publishDataSG, persistPartnerData, cleanupData, publishAllData } = require("./enterprise-process-jobs");

module.exports = [
    processData,
    publishDataTRIRIGA,
    publishDataCHS,
    publishDataSG,
    persistPartnerData,
    cleanupData,
    publishAllData
];
