// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// tslint:disable: no-unsafe-any no-import-side-effect no-require-imports no-var-requires
require = require('esm')(module); // support ES6 module syntax for Office Fabric package

import './overrides';

import * as dotenv from 'dotenv';
import * as yargs from 'yargs';
import * as crawler from './main';

interface Arguments {
    url: string;
}

(async () => {
    dotenv.config();

    const args = (yargs
        .usage('Usage: $0 --url <url>')
        .options({
            url: {
                type: 'string',
                describe: 'url to scan for accessibility issues',
                demandOption: true,
                default: 'https://accessibilityinsights.io/',
            },
        })
        .describe('help', 'show help').argv as unknown) as Arguments;

    const crawlerEngine = new crawler.CrawlerEngine();
    await crawlerEngine.start({
        baseUrl: args.url,
    });
})().catch(error => {
    console.log('Exception: ', error);
    process.exit(1);
});
