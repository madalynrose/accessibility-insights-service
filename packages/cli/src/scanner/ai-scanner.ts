// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { inject, injectable } from 'inversify';
import { AxeScanResults, Page, AxePuppeteerScanner } from 'scanner-global-library';
import { System } from 'common';

@injectable()
export class AIScanner {
    constructor(
        @inject(Page) private readonly page: Page,
        @inject(AxePuppeteerScanner) private readonly axePuppeteerScanner: AxePuppeteerScanner,
    ) {}

    public async scan(url: string, browserExecutablePath?: string, sourcePath?: string): Promise<AxeScanResults> {
        try {
            console.log(`Starting accessibility scanning of URL ${url}`);
            await this.page.create({ browserExecutablePath });
            await this.page.navigate(url);

            return await this.axePuppeteerScanner.scan(this.page, sourcePath);
        } catch (error) {
            console.log(error, `An error occurred while scanning website page ${url}`);

            return { error: System.serializeError(error) };
        } finally {
            await this.page.close();
            console.log(`Accessibility scanning of URL ${url} completed`);
        }
    }

    public getUserAgent(): string {
        return this.page.userAgent;
    }
}
