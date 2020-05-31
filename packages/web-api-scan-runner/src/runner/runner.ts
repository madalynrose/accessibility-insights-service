// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { FeatureFlags, GuidGenerator, ServiceConfiguration } from 'common';
import { inject, injectable } from 'inversify';
import { isEmpty, isNil } from 'lodash';
import { GlobalLogger, ScanTaskCompletedMeasurements } from 'logger';
import { AxeScanResults } from 'scanner';
import { OnDemandPageScanRunResultProvider, PageScanRunReportService } from 'service-library';
import {
    OnDemandNotificationRequestMessage,
    OnDemandPageScanReport,
    OnDemandPageScanResult,
    OnDemandPageScanRunResult,
    OnDemandPageScanRunState,
    OnDemandScanResult,
    ScanCompletedNotification,
    ScanError,
} from 'storage-documents';
import { GeneratedReport, ReportGenerator } from '../report-generator/report-generator';
import { ScanMetadataConfig } from '../scan-metadata-config';
import { NotificationQueueMessageSender } from '../tasks/notification-queue-message-sender';
import { ScannerTask } from '../tasks/scanner-task';
import { WebDriverTask } from '../tasks/web-driver-task';

// tslint:disable: no-null-keyword no-any

@injectable()
export class Runner {
    constructor(
        @inject(GuidGenerator) private readonly guidGenerator: GuidGenerator,
        @inject(ScanMetadataConfig) private readonly scanMetadataConfig: ScanMetadataConfig,
        @inject(ScannerTask) private readonly scannerTask: ScannerTask,
        @inject(OnDemandPageScanRunResultProvider) private readonly onDemandPageScanRunResultProvider: OnDemandPageScanRunResultProvider,
        @inject(WebDriverTask) private readonly webDriverTask: WebDriverTask,
        @inject(GlobalLogger) private readonly logger: GlobalLogger,
        @inject(PageScanRunReportService) private readonly pageScanRunReportService: PageScanRunReportService,
        @inject(ReportGenerator) private readonly reportGenerator: ReportGenerator,
        @inject(ServiceConfiguration) protected readonly serviceConfig: ServiceConfiguration,
        @inject(NotificationQueueMessageSender) protected readonly notificationDispatcher: NotificationQueueMessageSender,
    ) {}

    public async run(): Promise<void> {
        const scanMetadata = this.scanMetadataConfig.getConfig();

        const scanStartedTimestamp: number = Date.now();
        const scanSubmittedTimestamp: number = this.guidGenerator.getGuidTimestamp(scanMetadata.id).getTime();

        this.logger.logInfo(`Reading page scan run result.`);
        this.logger.setCustomProperties({ scanId: scanMetadata.id });

        this.logger.trackEvent('ScanRequestRunning', undefined, { runningScanRequests: 1 });
        this.logger.trackEvent('ScanTaskStarted', undefined, {
            scanWaitTime: (scanStartedTimestamp - scanSubmittedTimestamp) / 1000,
            startedScanTasks: 1,
        });

        this.logger.logInfo(`Updating page scan run result state to running.`);
        const pageScanResult: Partial<OnDemandPageScanResult> = {
            id: scanMetadata.id,
            run: {
                state: 'running',
                timestamp: new Date().toJSON(),
                error: null,
            },
            scanResult: null,
            reports: null,
        };

        await this.onDemandPageScanRunResultProvider.updateScanRun(pageScanResult);

        let scanSucceeded: boolean;
        try {
            await this.webDriverTask.launch();
            scanSucceeded = await this.scan(pageScanResult, scanMetadata.url);
        } catch (error) {
            scanSucceeded = false;
            const errorMessage = this.getErrorMessage(error);
            pageScanResult.run = this.createRunResult('failed', errorMessage);
            this.logger.logInfo(`Page scan run failed.`, { error: errorMessage });
        } finally {
            const scanCompletedTimestamp: number = Date.now();
            const telemetryMeasurements: ScanTaskCompletedMeasurements = {
                scanExecutionTime: (scanCompletedTimestamp - scanStartedTimestamp) / 1000,
                scanTotalTime: (scanCompletedTimestamp - scanSubmittedTimestamp) / 1000,
                completedScanTasks: 1,
            };
            this.logger.trackEvent('ScanTaskCompleted', undefined, telemetryMeasurements);
            this.logger.trackEvent('ScanRequestCompleted', undefined, { completedScanRequests: 1 });

            try {
                await this.webDriverTask.close();
            } catch (error) {
                this.logger.logError(`Unable to close the web driver instance.`, { error: this.getErrorMessage(error) });
            }
        }

        if (!scanSucceeded) {
            this.logger.trackEvent('ScanRequestFailed', undefined, { failedScanRequests: 1 });
            this.logger.trackEvent('ScanTaskFailed', undefined, { failedScanTasks: 1 });
        }

        this.logger.logInfo(`Writing page scan run result to a storage.`);
        const fullPageScanResult = await this.onDemandPageScanRunResultProvider.updateScanRun(pageScanResult);

        const featureFlags = await this.getDefaultFeatureFlags();
        this.logger.logInfo(`sendNotification feature flag ${featureFlags.sendNotification}`);
        if (featureFlags.sendNotification && !this.scanNotifyUrlEmpty(fullPageScanResult.notification)) {
            this.logger.logInfo(`Sending notification to ${fullPageScanResult.notification.scanNotifyUrl}`);
            await this.notificationDispatcher.sendNotificationMessage(this.createOnDemandNotificationRequestMessage(fullPageScanResult));
        }
    }

    private scanNotifyUrlEmpty(notification: ScanCompletedNotification): boolean {
        // tslint:disable-next-line: strict-boolean-expressions whitespace
        return isEmpty(notification?.scanNotifyUrl);
    }

    private async scan(pageScanResult: Partial<OnDemandPageScanResult>, url: string): Promise<boolean> {
        this.logger.logInfo(`Running page scan.`);

        const axeScanResults = await this.scannerTask.scan(url);

        if (!isNil(axeScanResults.error)) {
            this.logger.logInfo(`Updating page scan run result state to failed`);
            pageScanResult.run = this.createRunResult('failed', axeScanResults.error);
        } else {
            this.logger.logInfo(`Updating page scan run result state to completed`);
            pageScanResult.run = this.createRunResult('completed');
            pageScanResult.scanResult = this.getScanStatus(axeScanResults);
            pageScanResult.reports = await this.generateAndSaveScanReports(axeScanResults);
            if (axeScanResults.scannedUrl !== undefined) {
                pageScanResult.scannedUrl = axeScanResults.scannedUrl;
            }
        }

        pageScanResult.run.pageTitle = axeScanResults.pageTitle;
        pageScanResult.run.pageResponseCode = axeScanResults.pageResponseCode;

        return isNil(axeScanResults.error);
    }

    private createRunResult(state: OnDemandPageScanRunState, error?: string | ScanError): OnDemandPageScanRunResult {
        return {
            state,
            timestamp: new Date().toJSON(),
            error,
        };
    }

    private getScanStatus(axeResults: AxeScanResults): OnDemandScanResult {
        if (axeResults.results.violations !== undefined && axeResults.results.violations.length > 0) {
            return {
                state: 'fail',
                issueCount: axeResults.results.violations.reduce((a, b) => a + b.nodes.length, 0),
            };
        } else {
            return {
                state: 'pass',
            };
        }
    }

    private async generateAndSaveScanReports(axeResults: AxeScanResults): Promise<OnDemandPageScanReport[]> {
        this.logger.logInfo(`Generating reports from scan results`);
        const reports = this.reportGenerator.generateReports(axeResults);

        return Promise.all(reports.map(async (report) => this.saveScanReport(report)));
    }

    private async saveScanReport(report: GeneratedReport): Promise<OnDemandPageScanReport> {
        this.logger.logInfo(`Saving ${report.format} report to a blob storage.`);
        const href = await this.pageScanRunReportService.saveReport(report.id, report.content);
        this.logger.logInfo(`${report.format} report saved to a blob ${href}`);

        return {
            format: report.format,
            href,
            reportId: report.id,
        };
    }

    private getErrorMessage(error: any): string {
        return error instanceof Error ? error.message : JSON.stringify(error);
    }

    private createOnDemandNotificationRequestMessage(scanResult: OnDemandPageScanResult): OnDemandNotificationRequestMessage {
        return {
            scanId: scanResult.id,
            scanNotifyUrl: scanResult.notification.scanNotifyUrl,
            runStatus: scanResult.run.state,
            scanStatus: scanResult.scanResult?.state,
        };
    }

    private async getDefaultFeatureFlags(): Promise<FeatureFlags> {
        return this.serviceConfig.getConfigValue('featureFlags');
    }
}
