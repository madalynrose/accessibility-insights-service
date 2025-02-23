// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import 'reflect-metadata';

import { AxeResults } from 'axe-core';
import { AxePuppeteerFactory, AxeScanResults, Page, AxePuppeteerScanner } from 'scanner-global-library';
import { IMock, It, Mock, Times } from 'typemoq';
import { AIScanner } from './ai-scanner';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('AIScanner', () => {
    let pageMock: IMock<Page>;
    let axePuppeteerScannerMock: IMock<AxePuppeteerScanner>;
    let scanner: AIScanner;
    let axeBrowserFactoryMock: IMock<AxePuppeteerFactory>;

    beforeEach(() => {
        axeBrowserFactoryMock = Mock.ofType();
        pageMock = Mock.ofType2<Page>(Page, [axeBrowserFactoryMock.object]);
        axePuppeteerScannerMock = Mock.ofType<AxePuppeteerScanner>();
        scanner = new AIScanner(pageMock.object, axePuppeteerScannerMock.object);
    });

    it('should create instance', () => {
        expect(scanner).not.toBeNull();
    });

    it('should launch browser page with given url and scan the page with axe-core', async () => {
        const url = 'some url';
        const axeResultsStub = 'axe results' as any as AxeResults;
        setupNewPageCall();
        setupPageNavigateCall(url);
        setupPageScanCall(url, axeResultsStub);
        await scanner.scan(url);

        verifyMocks();
    });

    it('should close browser if exception occurs', async () => {
        const url = 'some url';
        const errorMessage: string = `An error occurred while scanning website page ${url}.`;
        setupNewPageCall();
        setupPageNavigateCall(url);
        setupPageErrorScanCall(url, errorMessage);
        setupPageCloseCall();
        const scanResult: AxeScanResults = await scanner.scan(url);
        expect(scanResult.error).not.toBeNull();
    });

    function setupNewPageCall(): void {
        pageMock.setup(async (p) => p.create(It.isObjectWith({ browserExecutablePath: undefined }))).verifiable(Times.once());
    }

    function setupPageCloseCall(): void {
        pageMock.setup(async (b) => b.close()).verifiable();
    }

    function setupPageNavigateCall(url: string): void {
        pageMock.setup((p) => p.navigate(url)).verifiable(Times.once());
    }

    function setupPageScanCall(url: string, axeResults: AxeResults): void {
        axePuppeteerScannerMock
            .setup(async (p) => p.scan(pageMock.object, undefined))
            .returns(async () => Promise.resolve({ results: axeResults }))
            .verifiable(Times.once());
    }

    function setupPageErrorScanCall(url: string, errorMessage: string): void {
        axePuppeteerScannerMock
            .setup(async (p) => p.scan(pageMock.object, undefined))
            .returns(async () => Promise.resolve({ error: errorMessage }))
            .verifiable(Times.once());
    }

    function verifyMocks(): void {
        pageMock.verifyAll();
    }
});
