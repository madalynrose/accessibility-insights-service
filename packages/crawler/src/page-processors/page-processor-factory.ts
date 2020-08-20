// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { CrawlerConfiguration } from '../crawler/crawler-configuration';
import { PageProcessorOptions } from '../types/run-options';
import { ClassicPageProcessor } from './classic-page-processor';
import { PageProcessor } from './page-processor-base';
import { SimulatorPageProcessor } from './simulator-page-processor';

export class PageProcessorFactory {
    constructor(private readonly crawlerConfiguration: CrawlerConfiguration = new CrawlerConfiguration()) {}

    public createPageProcessor(pageProcessorOptions: PageProcessorOptions): PageProcessor {
        if (!pageProcessorOptions.crawlerRunOptions.simulate) {
            return new ClassicPageProcessor(
                pageProcessorOptions.requestQueue,
                this.crawlerConfiguration.getDiscoveryPattern(
                    pageProcessorOptions.crawlerRunOptions.baseUrl,
                    pageProcessorOptions.crawlerRunOptions.discoveryPatterns,
                ),
            );
        }

        return new SimulatorPageProcessor(
            pageProcessorOptions.requestQueue,
            this.crawlerConfiguration.getDiscoveryPattern(
                pageProcessorOptions.crawlerRunOptions.baseUrl,
                pageProcessorOptions.crawlerRunOptions.discoveryPatterns,
            ),
            this.crawlerConfiguration.getDefaultSelectors(pageProcessorOptions.crawlerRunOptions.selectors),
        );
    }
}
