// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as Apify from 'apify';
import { RequestQueueBase } from './request-queue-base';

export function toApifyInstance(requestQueue: Apify.RequestQueue | RequestQueueBase): Apify.RequestQueue {
    return <Apify.RequestQueue>(<unknown>requestQueue);
}
