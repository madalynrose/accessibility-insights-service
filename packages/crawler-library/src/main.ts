// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as Apify from 'apify';
import * as cheerio from 'cheerio';
import { ApifyFactory, CrawlerFactory } from './apify-factory';
import { ClassicPageProcessorFactory, PageProcessorFactory } from './page-processor-factory';

// tslint:disable: no-unsafe-any

export interface CrawlerRunOptions {
    baseUrl: string;
    existingUrls?: string[];
    discoveryPatterns?: string[];
}

export class CrawlerEngine {
    public constructor(
        private readonly crawlerFactory: CrawlerFactory = new ApifyFactory(),
        private readonly pageProcessorFactory: PageProcessorFactory = new ClassicPageProcessorFactory(),
    ) {}

    public async start(crawlerRunOptions: CrawlerRunOptions): Promise<void> {
        const requestList = await this.crawlerFactory.createRequestList(crawlerRunOptions.existingUrls);
        const requestQueue = await this.crawlerFactory.createRequestQueue(crawlerRunOptions.baseUrl);
        const pageProcessor = this.pageProcessorFactory.createPageProcessor({
            baseUrl: crawlerRunOptions.baseUrl,
            requestQueue,
            discoveryPatterns: crawlerRunOptions.discoveryPatterns,
        });

        Apify.main(async () => {
            const crawler = new Apify.PuppeteerCrawler({
                requestList,
                requestQueue,
                handlePageFunction: pageProcessor.pageProcessor,
                handleFailedRequestFunction: pageProcessor.pageErrorProcessor,
            });

            await crawler.run();
        });
    }
}
