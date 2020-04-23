// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as url from 'url';
import { ClassicPageProcessor, PageProcessorBase, PageProcessorOptions, PageProcessorType } from './page-processor';

export class PageProcessorFactory {
    public createPageProcessor(pageProcessorType: PageProcessorType, pageProcessorOptions: PageProcessorOptions): PageProcessorBase {
        switch (pageProcessorType) {
            case 'ClassicPageProcessor':
                const discoveryPatterns =
                    pageProcessorOptions.discoveryPatterns === undefined
                        ? this.getDefaultDiscoveryPattern(pageProcessorOptions.baseUrl)
                        : pageProcessorOptions.discoveryPatterns;

                return new ClassicPageProcessor(pageProcessorOptions.requestQueue, discoveryPatterns);
            default:
                throw new Error(`Unsupported page processor type '${pageProcessorType}'`);
        }
    }

    private getDefaultDiscoveryPattern(baseUrl: string): string[] {
        const baseUrlObj = url.parse(baseUrl);

        return [`http[s?]://${baseUrlObj.host}${baseUrlObj.path}[.*]`];
    }
}
