// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import 'reflect-metadata';

import { IMock, Mock, It, Times } from 'typemoq';
import { RetryHelper } from 'common';
import { AxeScanResults } from 'scanner-global-library';
import { AxeResults } from 'axe-core';
import {
    OnDemandPageScanResult,
    WebsiteScanResult,
    CombinedScanResults,
    OnDemandPageScanReport,
    WebsiteScanReport,
} from 'storage-documents';
import { MockableLogger } from '../test-utilities/mockable-logger';
import { WebsiteScanResultProvider } from '../data-providers/website-scan-result-provider';
import { GeneratedReport, ReportWriter } from '../data-providers/report-writer';
import { CombinedScanResultProcessor } from './combined-scan-result-processor';
import { CombinedAxeResultBuilder } from './combined-axe-result-builder';
import { CombinedReportGenerator } from './combined-report-generator';
import { CombinedResultsBlobProvider, CombinedResultsBlob } from './combined-results-blob-provider';

/* eslint-disable @typescript-eslint/no-explicit-any */

let combinedAxeResultBuilderMock: IMock<CombinedAxeResultBuilder>;
let combinedReportGeneratorMock: IMock<CombinedReportGenerator>;
let combinedResultsBlobProviderMock: IMock<CombinedResultsBlobProvider>;
let websiteScanResultProviderMock: IMock<WebsiteScanResultProvider>;
let reportWriterMock: IMock<ReportWriter>;
let retryHelperMock: IMock<RetryHelper<void>>;
let loggerMock: IMock<MockableLogger>;
let combinedScanResultProcessor: CombinedScanResultProcessor;
let axeScanResults: AxeScanResults;
let pageScanResult: OnDemandPageScanResult;
let websiteScanResult: WebsiteScanResult;
let updatedWebsiteScanResults: Partial<WebsiteScanResult>;
let combinedResultsBlob: CombinedResultsBlob;
let combinedAxeResults: CombinedScanResults;
let generatedReport: GeneratedReport;
let pageScanReport: OnDemandPageScanReport;
let consolidatedReport: WebsiteScanReport;

const combinedResultsBlobId = 'combinedResultsBlobId';
const websiteScanId = 'websiteScanId';

describe(CombinedScanResultProcessor, () => {
    beforeEach(() => {
        combinedAxeResultBuilderMock = Mock.ofType(CombinedAxeResultBuilder);
        combinedReportGeneratorMock = Mock.ofType(CombinedReportGenerator);
        combinedResultsBlobProviderMock = Mock.ofType(CombinedResultsBlobProvider);
        websiteScanResultProviderMock = Mock.ofType(WebsiteScanResultProvider);
        reportWriterMock = Mock.ofType(ReportWriter);
        retryHelperMock = Mock.ofType<RetryHelper<void>>();
        loggerMock = Mock.ofType(MockableLogger);

        pageScanResult = {} as OnDemandPageScanResult;
        axeScanResults = {
            browserResolution: 'browserResolution',
            userAgent: 'userAgent',
            results: {
                url: 'url',
            } as AxeResults,
        };
        combinedResultsBlob = {
            blobId: combinedResultsBlobId,
        } as CombinedResultsBlob;
        combinedAxeResults = {
            urlCount: {
                total: 12,
            },
        } as CombinedScanResults;
        generatedReport = {
            content: 'report content',
        } as GeneratedReport;
        pageScanReport = {
            reportId: 'reportId',
            href: 'href',
        } as OnDemandPageScanReport;
        consolidatedReport = {
            reportId: combinedResultsBlobId,
            href: 'href',
            format: 'consolidated.html',
        };

        setupRetryHelperMock();
        combinedScanResultProcessor = new CombinedScanResultProcessor(
            combinedAxeResultBuilderMock.object,
            combinedReportGeneratorMock.object,
            combinedResultsBlobProviderMock.object,
            websiteScanResultProviderMock.object,
            reportWriterMock.object,
            retryHelperMock.object,
            loggerMock.object,
        );
    });

    afterEach(() => {
        combinedAxeResultBuilderMock.verifyAll();
        combinedReportGeneratorMock.verifyAll();
        combinedResultsBlobProviderMock.verifyAll();
        websiteScanResultProviderMock.verifyAll();
        reportWriterMock.verifyAll();
        retryHelperMock.verifyAll();
        loggerMock.verifyAll();
    });

    it('skip generating combined report for a large blob', async () => {
        (combinedScanResultProcessor as any).maxCombinedResultsBlobSize = 2;
        pageScanResult = {
            id: 'id',
            websiteScanRefs: [
                {
                    id: websiteScanId,
                    scanGroupType: 'consolidated-scan-report',
                },
            ],
        } as OnDemandPageScanResult;

        setupFullPass();
        combinedAxeResultBuilderMock.reset();
        combinedReportGeneratorMock.reset();
        websiteScanResultProviderMock.reset();
        reportWriterMock.reset();

        websiteScanResultProviderMock
            .setup((o) => o.read(websiteScanId))
            .returns(() => Promise.resolve(websiteScanResult))
            .verifiable();

        await combinedScanResultProcessor.generateCombinedScanResults(axeScanResults, pageScanResult);

        expect(pageScanResult.reports).toBeUndefined();
    });

    it('generate combined report for consolidated scan request', async () => {
        pageScanResult = {
            id: 'id',
            websiteScanRefs: [
                {
                    id: websiteScanId,
                    scanGroupType: 'consolidated-scan-report',
                },
            ],
        } as OnDemandPageScanResult;
        setupFullPass();

        await combinedScanResultProcessor.generateCombinedScanResults(axeScanResults, pageScanResult);

        expect(pageScanResult.reports[0]).toEqual(pageScanReport);
    });

    it('generate combined report for deep scan request', async () => {
        pageScanResult = {
            id: 'id',
            websiteScanRefs: [
                {
                    id: websiteScanId,
                    scanGroupType: 'deep-scan',
                },
            ],
        } as OnDemandPageScanResult;
        setupFullPass();

        await combinedScanResultProcessor.generateCombinedScanResults(axeScanResults, pageScanResult);

        expect(pageScanResult.reports[0]).toEqual(pageScanReport);
    });

    it('should replace report reference if already exists', async () => {
        pageScanResult = {
            id: 'id',
            websiteScanRefs: [
                {
                    id: websiteScanId,
                    scanGroupType: 'deep-scan',
                },
            ],
            reports: [
                {
                    reportId: 'reportId',
                    href: 'old href',
                },
            ],
        } as OnDemandPageScanResult;
        setupFullPass();

        await combinedScanResultProcessor.generateCombinedScanResults(axeScanResults, pageScanResult);

        expect(pageScanResult.reports.length).toEqual(1);
        expect(pageScanResult.reports[0]).toEqual(pageScanReport);
    });
});

function setupFullPass(): void {
    websiteScanResult = {
        id: 'websiteScanResultId',
        reports: [consolidatedReport],
    } as WebsiteScanResult;
    updatedWebsiteScanResults = {
        ...websiteScanResult,
        reports: [pageScanReport],
    };

    combinedResultsBlobProviderMock
        .setup((o) => o.getBlob(combinedResultsBlobId))
        .returns(() => Promise.resolve(combinedResultsBlob))
        .verifiable();
    combinedAxeResultBuilderMock
        .setup((o) => o.mergeAxeResults(axeScanResults.results, combinedResultsBlob))
        .returns(() => Promise.resolve(combinedAxeResults))
        .verifiable();
    combinedReportGeneratorMock
        .setup((o) =>
            o.generate(
                combinedResultsBlobId,
                combinedAxeResults,
                websiteScanResult,
                axeScanResults.userAgent,
                axeScanResults.browserResolution,
            ),
        )
        .returns(() => generatedReport)
        .verifiable();
    reportWriterMock
        .setup((o) => o.write(generatedReport))
        .returns(() => Promise.resolve(pageScanReport))
        .verifiable();
    setupWebsiteScanResultProviderMock();
}

function setupWebsiteScanResultProviderMock(): void {
    websiteScanResultProviderMock
        .setup((o) => o.read(websiteScanId))
        .returns(() => Promise.resolve(websiteScanResult))
        .verifiable();
    websiteScanResultProviderMock.setup((o) => o.mergeOrCreate(pageScanResult.id, It.isValue(updatedWebsiteScanResults))).verifiable();
}

function setupRetryHelperMock(times: number = 1): void {
    retryHelperMock
        .setup(async (o) => o.executeWithRetries(It.isAny(), It.isAny(), 5, 1000))
        .returns(async (action: () => Promise<void>, errorHandler: (err: Error) => Promise<void>, maxRetries: number) => {
            return action();
        })
        .verifiable(Times.exactly(times));
}
