// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import 'reflect-metadata';

import { Container } from 'inversify';
import { AxePuppeteerFactory } from './axe-scanner/axe-puppeteer-factory';
import { setupCloudScannerContainer, setupLocalScannerContainer } from './setup-scanner-container';
import { cloudAxeConfiguration, localAxeConfiguration } from './axe-scanner/axe-configuration';
import { webAxeRunOptions } from './axe-scanner/axe-run-options';
import { iocTypes } from './ioc-types';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe(setupCloudScannerContainer, () => {
    let container: Container;

    beforeEach(() => {
        container = new Container({ autoBindInjectable: true });
        setupCloudScannerContainer(container);
    });

    it('should register AxePuppeteerFactory as a singleton', () => {
        verifySingletonResolution(AxePuppeteerFactory);
    });

    it('should use cloudAxeConfiguration', () => {
        expect(container.get(iocTypes.AxeConfiguration)).toBe(cloudAxeConfiguration);
    });

    it('should use webAxeRunOptions', () => {
        expect(container.get(iocTypes.AxeRunOptions)).toBe(webAxeRunOptions);
    });

    function verifySingletonResolution(key: any): void {
        expect(container.get(key)).toBeDefined();
        expect(container.get(key)).toBe(container.get(key));
    }
});

describe(setupLocalScannerContainer, () => {
    let container: Container;

    beforeEach(() => {
        container = new Container({ autoBindInjectable: true });
        setupLocalScannerContainer(container);
    });

    it('should use localAxeConfiguration', () => {
        expect(container.get(iocTypes.AxeConfiguration)).toBe(localAxeConfiguration);
    });

    it('should use webAxeRunOptions', () => {
        expect(container.get(iocTypes.AxeRunOptions)).toBe(webAxeRunOptions);
    });
});
