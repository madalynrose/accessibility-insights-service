// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import 'reflect-metadata';

import { System } from 'common';
import { IMock, Mock, Times, It, MockBehavior } from 'typemoq';
import { AvailabilityTelemetry } from './availability-telemetry';
import { BaseTelemetryProperties } from './base-telemetry-properties';
import { ConsoleLoggerClient } from './console-logger-client';
import { GlobalLogger } from './global-logger';
import { LogLevel } from './logger';
import { LoggerClient } from './logger-client';

/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any, no-void */

describe(GlobalLogger, () => {
    let loggerClient1Mock: IMock<LoggerClient>;
    let loggerClient2Mock: IMock<LoggerClient>;
    let testSubject: GlobalLogger;

    beforeEach(() => {
        loggerClient1Mock = Mock.ofType2(ConsoleLoggerClient, null, MockBehavior.Strict);
        loggerClient2Mock = Mock.ofType2(ConsoleLoggerClient, null, MockBehavior.Strict);
        setupAllLoggerClientsInit();

        testSubject = new GlobalLogger([loggerClient1Mock.object, loggerClient2Mock.object], 500);
    });

    describe('setup', () => {
        it('verify default setup', async () => {
            await testSubject.setup();

            verifyMocks();
        });

        it('throw when client fail to initialize', async () => {
            invokeAllLoggerClientMocks((client) => {
                client.reset();
                client.setup((o) => o.initialized).returns(() => false);
                client.setup(async (o) => o.setup(It.isAny())).returns(() => Promise.resolve());
            });

            await expect(testSubject.setup()).rejects.toThrowError(/Failed to initialize logger clients/);
        });

        it('does not initialize more than once', async () => {
            const baseProps: BaseTelemetryProperties = { foo: 'bar', source: 'test-source' };
            setupAllLoggerClientsInit(baseProps);

            await testSubject.setup(baseProps);
            await testSubject.setup(baseProps);

            verifyMocks();
        });

        it('initializes with additional common properties', async () => {
            const baseProps: BaseTelemetryProperties = { foo: 'bar', source: 'test-source' };
            setupAllLoggerClientsInit(baseProps);

            await testSubject.setup(baseProps);

            verifyMocks();
        });
    });

    describe('trackMetric', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.trackMetric('metric1', 1);
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('when value not passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.trackMetric('metric1', 1)).verifiable(Times.once()));

            testSubject.trackMetric('metric1');

            verifyMocks();
        });

        it('when value passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.trackMetric('metric1', 10)).verifiable(Times.once()));

            testSubject.trackMetric('metric1', 10);

            verifyMocks();
        });
    });

    describe('trackEvent', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.trackEvent('HealthCheck', { foo: 'bar' });
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('when properties/measurements not passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.trackEvent('HealthCheck', undefined, undefined)).verifiable(Times.once()));

            testSubject.trackEvent('HealthCheck');

            verifyMocks();
        });

        it('when properties/measurements passed', async () => {
            const properties = { foo: 'bar' };
            const measurements = { completedScanRequests: 1 };
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) =>
                m.setup((c) => c.trackEvent('HealthCheck', properties, measurements)).verifiable(Times.once()),
            );

            testSubject.trackEvent('HealthCheck', properties, measurements);

            verifyMocks();
        });
    });

    describe('trackAvailability', () => {
        const availabilityTelemetryData: AvailabilityTelemetry = 'test data' as any;
        const name = 'test availability name';

        it('throw if called before setup', () => {
            expect(() => {
                testSubject.trackAvailability(name, availabilityTelemetryData);
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('invokes logger clients', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) =>
                m.setup((c) => c.trackAvailability(name, availabilityTelemetryData)).verifiable(Times.once()),
            );

            testSubject.trackAvailability(name, availabilityTelemetryData);

            verifyMocks();
        });
    });

    describe('log', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.log('trace1', LogLevel.warn);
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('when properties not passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('trace1', LogLevel.error, undefined)).verifiable(Times.once()));

            testSubject.log('trace1', LogLevel.error);

            verifyMocks();
        });

        it('when properties passed', async () => {
            const properties = { foo: 'bar' };
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('trace1', LogLevel.error, properties)).verifiable(Times.once()));

            testSubject.log('trace1', LogLevel.error, properties);

            verifyMocks();
        });
    });

    describe('logInfo', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.logInfo('info1');
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('when properties not passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('info1', LogLevel.info, undefined)).verifiable(Times.once()));

            testSubject.logInfo('info1');

            verifyMocks();
        });

        it('when properties passed', async () => {
            const properties = { foo: 'bar' };
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('info1', LogLevel.info, properties)).verifiable(Times.once()));

            testSubject.logInfo('info1', properties);

            verifyMocks();
        });
    });

    describe('logWarn', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.logWarn('warn1');
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('when properties not passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('warn1', LogLevel.warn, undefined)).verifiable(Times.once()));

            testSubject.logWarn('warn1');

            verifyMocks();
        });

        it('when properties passed', async () => {
            const properties = { foo: 'bar' };
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('warn1', LogLevel.warn, properties)).verifiable(Times.once()));

            testSubject.logWarn('warn1', properties);

            verifyMocks();
        });
    });

    describe('logError', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.logError('error1');
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('when properties not passed', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('error1', LogLevel.error, undefined)).verifiable(Times.once()));

            testSubject.logError('error1');

            verifyMocks();
        });

        it('when properties passed', async () => {
            const properties = { foo: 'bar' };
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.log('error1', LogLevel.error, properties)).verifiable(Times.once()));

            testSubject.logError('error1', properties);

            verifyMocks();
        });
    });

    describe('logVerbose', () => {
        describe('in debug mode', () => {
            beforeEach(async () => {
                System.isDebugEnabled = () => true;
                await testSubject.setup();
            });

            it('when properties not passed', () => {
                invokeAllLoggerClientMocks((m) =>
                    m.setup((c) => c.log('HealthCheck', LogLevel.verbose, undefined)).verifiable(Times.once()),
                );

                testSubject.logVerbose('HealthCheck');

                verifyMocks();
            });

            it('when properties passed', () => {
                const properties = { foo: 'bar' };
                invokeAllLoggerClientMocks((m) =>
                    m.setup((c) => c.log('HealthCheck', LogLevel.verbose, properties)).verifiable(Times.once()),
                );

                testSubject.logVerbose('HealthCheck', properties);

                verifyMocks();
            });
        });

        describe('in normal mode', () => {
            beforeEach(async () => {
                System.isDebugEnabled = () => false;
            });

            it('when properties not passed', async () => {
                await testSubject.setup();

                testSubject.logVerbose('HealthCheck');

                verifyMocks();
            });

            it('when properties passed', async () => {
                const properties = { foo: 'bar' };
                await testSubject.setup();

                testSubject.logVerbose('HealthCheck', properties);

                verifyMocks();
            });
        });
    });

    describe('trackException', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.trackException(new Error('test error'));
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('trackException', async () => {
            const error = new Error('some error');
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) => m.setup((c) => c.trackException(error)).verifiable(Times.once()));

            testSubject.trackException(error);

            verifyMocks();
        });
    });

    describe('trackExceptionAny', () => {
        it('throw if called before setup', () => {
            expect(() => {
                testSubject.trackExceptionAny(new Error('test error'), 'error message');
            }).toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('handles when passed error object', async () => {
            const underlyingError = new Error('internal error');
            const errorMessage = 'error message';
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) =>
                m
                    .setup((c) => c.trackException(new Error(`${errorMessage} ${System.serializeError(underlyingError)}`)))
                    .verifiable(Times.once()),
            );

            testSubject.trackExceptionAny(underlyingError, errorMessage);

            verifyMocks();
        });

        it('handles when passed non-error object', async () => {
            const underlyingError = { err: 'internal error' };
            const errorMessage = 'error message';
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) =>
                m
                    .setup((c) => c.trackException(new Error(`${errorMessage} ${System.serializeError(underlyingError)}`)))
                    .verifiable(Times.once()),
            );

            testSubject.trackExceptionAny(underlyingError, errorMessage);

            verifyMocks();
        });
    });

    describe('flush', () => {
        it('throw if called before setup', async () => {
            await expect(testSubject.flush()).rejects.toThrowError(
                'The logger instance is not initialized. Ensure the setup() method is invoked by derived class implementation.',
            );
        });

        it('flushes events', async () => {
            await testSubject.setup();
            invokeAllLoggerClientMocks((m) =>
                m
                    .setup((c) => c.flush())
                    .returns(() => Promise.resolve())
                    .verifiable(Times.once()),
            );

            await testSubject.flush();
        });
    });

    function verifyMocks(): void {
        loggerClient1Mock.verifyAll();
        loggerClient2Mock.verifyAll();
    }

    function setupAllLoggerClientsInit(baseProperties?: BaseTelemetryProperties): void {
        invokeAllLoggerClientMocks((client) => client.setup((o) => o.initialized).returns(() => false));
        invokeAllLoggerClientMocks((client) =>
            client
                .setup(async (o) => o.setup(baseProperties !== undefined ? baseProperties : It.isAny()))
                .callback(() => {
                    client.reset();
                    client
                        .setup((o) => o.initialized)
                        .returns(() => true)
                        .verifiable(Times.atLeastOnce());
                })
                .returns(() => Promise.resolve()),
        );
    }

    function invokeAllLoggerClientMocks(action: (loggerClient: IMock<LoggerClient>) => void): void {
        action(loggerClient1Mock);
        action(loggerClient2Mock);
    }
});
