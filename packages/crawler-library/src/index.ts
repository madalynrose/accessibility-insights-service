// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// tslint:disable: no-import-side-effect
import './overrides';

import * as dotenv from 'dotenv';
import * as crawler from './main';

(async () => {
    dotenv.config();

    const crawlerEngine = new crawler.CrawlerEngine();
    await crawlerEngine.start({
        baseUrl: 'https://accessibilityinsights.io/',
    });
})().catch(error => {
    console.log('Exception: ', error);
    process.exit(1);
});
