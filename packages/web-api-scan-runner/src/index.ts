// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// tslint:disable: no-implicit-dependencies no-var-requires no-require-imports no-unsafe-any
require = require('esm')(module); // support ES6 module syntax for Office Fabric package

import 'reflect-metadata';

import { WhyNodeRunningLogger } from 'common';
import { setupWebApiScanRequestSenderContainer } from './setup-web-api-scan-runner-container';
import { WebApiScanRunnerEntryPoint } from './web-api-scan-runner-entry-point';

const whyNodeRunLogger = new WhyNodeRunningLogger();

(async () => {
    await new WebApiScanRunnerEntryPoint(setupWebApiScanRequestSenderContainer()).start();
    await whyNodeRunLogger.logAfterSeconds(2);
})().catch(() => {
    process.exit(1);
});
