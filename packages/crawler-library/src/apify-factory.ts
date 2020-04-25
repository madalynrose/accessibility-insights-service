// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as Apify from 'apify';

export interface CrawlerFactory {
    createRequestList(existingUrls: string[]): Promise<Apify.RequestList>;
    createRequestQueue(baseUrl: string): Promise<Apify.RequestQueue>;
}

export class ApifyFactory implements CrawlerFactory {
    public async createRequestQueue(baseUrl: string): Promise<Apify.RequestQueue> {
        const requestQueue = await Apify.openRequestQueue('queueId-test');
        await requestQueue.addRequest({ url: baseUrl });

        return requestQueue;
    }

    public async createRequestList(existingUrls: string[]): Promise<Apify.RequestList> {
        return Apify.openRequestList('existingUrls', existingUrls === undefined ? [] : existingUrls);
    }
}
