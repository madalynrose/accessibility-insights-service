<!--
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
-->

# ai-scan

AI-Scan is a Command Line Interface (CLI) tool that implements automated web accessibility checks in a local environment. The tool currently provides the following capabilities:

-   Single URL scan: Run automated checks against one URL.
-   Batch Scan: Run automated checks against a file that has list of URLs separated by a new line.
-   Scan & Crawl : Run automated checks against one URL, crawl that URL and run automated checks against all discovered URLs.

## Installation

This package is available on [npm](http://npmjs.com) as `accessibility-insights-scan`.

```sh
  npm install -g accessibility-insights-scan
```

When installing package on [Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/about) follow the steps below.

-   [Configure npm to use a different directory](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally) to support global package installation.
-   Install package globally:

```sh
  npm install --unsafe-perm=true -g accessibility-insights-scan
```

## Example Usage

## Single URL Scan

-   Required --url parameter with URL to scan.
-   An HTML report will be generated in the output folder, previous result for same URL will be overwritten.

```sh
  npx ai-scan --url https://www.example.com/
```

### Options

-   url: --url

```sh
type: boolean
describe: The URL to scan for accessibility issues.
```

-   output: --output

```sh
type: string
describe: Output directory. If not set, default is ./ai_scan_cli_output, if you use the same output for different runs, an existing result might be overwritten.
default: './ai_scan_cli_output'
```

</br></br>

## Batch Scan

-   Required --inputFile option with list of URLs to scan, separated by a new line.
-   Summary HTML report will be generated in the output folder; previous result will be overwritten.
-   The error log will be generated in case of any error.

```sh
  npx ai-scan --inputFile 'input file path'
```

### Options

-   inputFile: --inputFile

```sh
type: string
describe: File path that contains list of URLs (each separated by a new line) to scan for accessibility issues.
```

-   output: --output

```sh
type: string
describe: Output directory. If not set, default is ./ai_scan_cli_output, if you use the same output for different runs, an existing result might be overwritten.
default: './ai_scan_cli_output'
```

</br></br>

## Scan & Crawl

-   Required --crawl and --url options with URL to be crawled and scanned.
-   Summary HTML report will be generated in the output folder; previous result will be overwritten if --restart is true.
-   The error log will be generated in case of any error.
-   The crawler will start with the base URL specified in the command line and progressively discover links (URLs) to be crawled and scanned.
-   A base URL to crawl is defined as URL host and should not have query and parameters.
-   Only URLs that located within the base URL folder would be considered for crawling and scanning. The URL folder is a resource location equal to base URL up-to the last forward slash in the specified base URL, or e.g:
    -   If base URL is specified as https://www.example.com/bar/foo , URLs that are in https://www.example.com/bar/ folder will be considered for crawling and scanning.
    -   If base URL is specified as https://www.example.com/bar/foo/ , only URLs that are in https://www.example.com/bar/foo/ folder will be considered for crawling and scanning.

```sh
  npx ai-scan --crawl --url https://www.example.com/
```

### Options

-   crawl: --crawl

```sh
type: boolean
describe: Crawl web site under the provided URL.
default: false
```

-   url: --url

```sh
type: boolean
describe: The URL to scan/crawl for accessibility issues.
```

-   simulate: --simulate

```sh
type: boolean
describe: Simulate user click on elements that match to the specified selectors.
default: false
```

-   selectors: --selectors

```sh
type: array
describe: List of CSS selectors to match against, separated by space. Default selector is 'button'.
default: ['button']
```

-   output: --output

```sh
type: string
describe: Output directory. Defaults to the value of CRAWLEE_STORAGE_DIR, if set, or ./ai_scan_cli_output, if not, if you use the same output for different runs, an existing result might be overwritten.
default: './ai_scan_cli_output'
```

-   maxUrls: --maxUrls

```sh
type: number
describe: Maximum number of pages that the crawler will open. The crawl will stop when this limit is reached.
Note that in cases of parallel crawling, the actual number of pages visited might be slightly higher than this value.
default: 100
```

-   restart: --restart

```sh
type: boolean
describe: Clear the pending crawl queue and start crawl from the provided URL when set to true, otherwise resume the crawl from the last request in the queue.
default: false
```

-   continue: --continue

```sh
type: boolean
describe: Continue to crawl using the pending crawl queue. Use this option to continue when previous scan was terminated.
Note that --url option will be ignored and previous value will be used instead.
default: false
```

-   snapshot: --snapshot

```sh
type: boolean
describe: Save snapshot of the crawled page. Enabled by default if simulation option is selected, otherwise false.
```

-   memoryMBytes: --memoryMBytes

```sh
type: number
describe: The maximum number of megabytes to be used by the crawler.
```

-   silentMode: --silentMode

```sh
type: boolean
describe: Open browser window while crawling when set to false.
default: true
```

-   inputFile: --inputFile

```sh
type: string
describe: File path that contains list of URLs (each separated by a new line) to scan in addition to URLs discovered from crawling the provided URL.
```

-   inputUrls: --inputUrls

```sh
type: array
describe: List of URLs to crawl in addition to URLs discovered from crawling the provided URL, separated by space.
```

-   discoveryPatterns: --discoveryPatterns

```sh
type: array
describe: List of RegEx patterns to crawl in addition to the provided URL, separated by space.
```

-   baselineFile: --baselineFile

```sh
type: string
describe: Baseline file path. If specified, scan results will be compared to baseline results and the summary report will denote which results are new.
If the results do not match the baseline file, a new baseline will be written to the output directory. To update the existing baseline file instead, use --updateBaseline.
```

-   updateBaseline: --updateBaseline

```sh
type: boolean
describe: Use with --baselineFile to update the baseline file in-place, rather than writing any updated baseline to the output directory.
```

-   singleWorker: --singleWorker

```sh
type: boolean
describe: Uses a single crawler worker.
```

-   debug: --debug

```sh
type: boolean
describe: Enables crawler engine debug mode.
```

-   authType: --authType

```sh
type: string
describe: For sites with authenticated pages, specify the authentication type. The CLI currently supports "AAD" (Azure Active Directory). Use with --serviceAccountName and --serviceAccountPassword.
```

-   serviceAccountName: --serviceAccountName

```sh
type: string
describe: For sites with authenticated pages, set the email address for the non-people service account.
```

-   serviceAccountPassword: --serviceAccountPassword

```sh
type: string
describe: For sites with authenticated pages, set the password for the non-people service account.
```

-   userAgent: --userAgent

```sh
type: string
describe: The custom value of the User-Agent HTTP request header. Defaults to the value of USER_AGENT environment variable. The option will take precedence over environment variable.
```

-   httpHeaders: --httpHeaders

```sh
type: string
describe: The custom HTTP header(s) to be send on each crawl request. Accepts JSON formatted string like {"name": "value"}.
```
