// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { System } from 'common';
import * as moment from 'moment';
import * as nodeFetch from 'node-fetch';
import * as yargs from 'yargs';

setupInputArgsExpectation();
const inputArgs = yargs.argv as yargs.Arguments<LoadTestArgs>;
console.log('Input args passed', inputArgs);

type LoadTestArgs = {
    scanNotifyUrl: string;
    adAuthToken: string;
    requestUrl: string;
    maxLoad: number;
};

function setupInputArgsExpectation(): void {
    yargs.option<keyof LoadTestArgs, yargs.Options>('maxLoad', {
        alias: 'l',
        default: 10,
        type: 'number',
    });

    yargs.option<keyof LoadTestArgs, yargs.Options>('requestUrl', {
        alias: 'r',
        demandOption: true,
    });

    yargs.option<keyof LoadTestArgs, yargs.Options>('scanNotifyUrl', {
        alias: 'n',
    });

    yargs.option<keyof LoadTestArgs, yargs.Options>('adAuthToken', {
        alias: 't',
        default: process.env.adAuthToken,
        demandOption: true,
        description: 'AD Auth token. Can be created using Postman. Either pass via command line or set env variable - adAuthToken',
    });
}

function getRequestOptions(): nodeFetch.RequestInit {
    const myHeaders: nodeFetch.HeaderInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inputArgs.adAuthToken}`,
    };

    const raw = JSON.stringify([
        {
            url: 'https://www.bing.com',
            priority: 1,
            scanNotifyUrl: inputArgs.scanNotifyUrl,
        },
    ]);

    return {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
        timeout: 5000,
    };
}

async function runLoadTest(): Promise<void> {
    const promises: Promise<void>[] = [];
    let successfulRequests = 0;
    let errorRequests = 0;
    const requestOptions = getRequestOptions();
    const responseCountByStatusCode: { [key: number]: number } = {};

    const submitRequest = async (requestId: number): Promise<void> => {
        let response: nodeFetch.Response;
        try {
            response = await nodeFetch.default(inputArgs.requestUrl, requestOptions);
            successfulRequests += 1;
            responseCountByStatusCode[response.status] = (responseCountByStatusCode[response.status] ?? 0) + 1;

            console.log(
                `[${moment().toISOString()}][Request ID ${requestId}] Status code ${
                    response.status
                } Response body ${await response.text()}`,
            );
        } catch (error) {
            errorRequests += 1;
            console.log(
                `[${moment().toISOString()}][Request ID ${requestId}] Status code ${
                    response !== undefined ? response.status : 'unknown'
                } Request error`,
                System.serializeError(error),
            );
        }
    };

    for (let i = 0; i < inputArgs.maxLoad; i += 1) {
        promises.push(submitRequest(i));
    }

    console.log(`[${moment().toISOString()}] Waiting for requests to complete...`);
    await Promise.all(promises);

    console.log(`
[${moment().toISOString()}] Load run completed.
Total requests submitted: ${inputArgs.maxLoad}
Completed requests ${successfulRequests}
Failed Requests ${errorRequests}
Completed Request count by response status code', ${responseCountByStatusCode}`);
}

runLoadTest().catch((error) => {
    console.log(`[${moment().toISOString()}] Error occurred`, System.serializeError(error));
});
