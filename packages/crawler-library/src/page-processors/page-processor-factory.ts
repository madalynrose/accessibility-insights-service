// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as url from 'url';
import { ClassicPageProcessor } from './classic-page-processor';
import { PageProcessorBase, PageProcessorOptions } from './page-processor';

export interface PageProcessorFactory {
    createPageProcessor(pageProcessorOptions: PageProcessorOptions): PageProcessorBase;
}

export abstract class PageProcessorFactoryBase {
    public abstract createPageProcessor(pageProcessorOptions: PageProcessorOptions): PageProcessorBase;

    protected getDiscoveryPattern(baseUrl: string, discoveryPatterns: string[]): string[] {
        return discoveryPatterns === undefined ? this.getDefaultDiscoveryPattern(baseUrl) : discoveryPatterns;
    }

    protected getDefaultDiscoveryPattern(baseUrl: string): string[] {
        const baseUrlObj = url.parse(baseUrl);

        return [`http[s?]://${baseUrlObj.host}${baseUrlObj.path}[.*]`];
    }
}

export class ClassicPageProcessorFactory extends PageProcessorFactoryBase {
    public createPageProcessor(pageProcessorOptions: PageProcessorOptions): PageProcessorBase {
        return new ClassicPageProcessor(
            pageProcessorOptions.requestQueue,
            this.getDiscoveryPattern(pageProcessorOptions.baseUrl, pageProcessorOptions.discoveryPatterns),
        );
    }
}
