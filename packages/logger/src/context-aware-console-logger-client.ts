// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ServiceConfiguration } from 'common';
import { inject, injectable } from 'inversify';
import { BaseConsoleLoggerClient } from './base-console-logger-client';
import { ConsoleLoggerClient } from './console-logger-client';
import { loggerTypes } from './logger-types';

@injectable()
export class ContextAwareConsoleLoggerClient extends BaseConsoleLoggerClient {
    constructor(
        @inject(ServiceConfiguration) protected readonly serviceConfig: ServiceConfiguration,
        @inject(loggerTypes.Console) protected readonly consoleObject: typeof console,
        @inject(ConsoleLoggerClient) private readonly rootLoggerClient: ConsoleLoggerClient,
    ) {
        super(serviceConfig, consoleObject);
    }

    protected getPropertiesToAddToEvent(): { [name: string]: string } {
        return { ...this.rootLoggerClient.getCommonProperties() };
    }
}
