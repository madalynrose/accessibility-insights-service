// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');
const { exec } = require('child_process');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const forkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const copyFilesPlugin = require('copy-webpack-plugin');
const { listMonorepoPackageNames } = require('common/dist/build-utilities/monorepo-packages');

// We set external node_modules as "externals" (ie, we don't bundle them), but we bundle other
// monorepo packages. From a library consumer's perspective, that means that they never see
// the other monorepo packages' package.json metadata; therefore, it is important that this
// package's "dependencies" entry be a superset of all the dependencies from all of the other
// monorepo packages we use. package.json.spec.ts enforces this.
function monorepoExternals() {
    return nodeExternals({
        additionalModuleDirs: [path.join(__dirname, '../../node_modules')],
        // "allowlist" means "these packages are *not* externals, have webpack bundle them"
        allowlist: listMonorepoPackageNames(),
    });
}

function getCommonConfig(version, generateTypings) {
    return {
        devtool: 'cheap-source-map',
        externals: [monorepoExternals()],
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: generateTypings ? false : true, // transpileOnly=false generates typings
                                experimentalWatchApi: true,
                                configFile: generateTypings ? 'tsconfig.sdk.json' : 'tsconfig.json',
                                logInfoToStdOut: true,
                                logLevel: 'INFO',
                            },
                        },
                    ],
                    exclude: ['/node_modules/', /\.(spec|e2e)\.ts$/],
                },
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'shebang-loader',
                            options: {
                                transpileOnly: true,
                                experimentalWatchApi: true,
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new webpack.BannerPlugin({ banner: generateTypings ? '' : '#!/usr/bin/env node', raw: true }),
            new webpack.DefinePlugin({
                __IMAGE_VERSION__: JSON.stringify(version),
            }),
            new copyFilesPlugin({
                patterns: [
                    { from: './../crawler/dist/browser-imports.js', to: '.' },
                    { from: '../../packages/scanner-global-library/blank-page.html', to: '.' },
                ],
            }),
        ]
            .concat(
                generateTypings
                    ? {
                          apply: (compiler) => {
                              compiler.hooks.afterEmit.tapPromise('BundleDtsFiles', (_) => {
                                  return new Promise((resolve, reject) =>
                                      exec(
                                          'dts-bundle-generator --project tsconfig.sdk.json src/index.ts -o dist/index.d.ts',
                                          (error, stdout, stderr) => {
                                              if (stdout) {
                                                  process.stdout.write(stdout);
                                              }
                                              if (stderr) {
                                                  process.stderr.write(stderr);
                                              }
                                              if (error != null && error.code !== 0) {
                                                  reject(new Error(`dts-bundle-generator exited with code ${error.code}`));
                                              }
                                              resolve();
                                          },
                                      ),
                                  );
                              });
                          },
                      }
                    : [],
            )
            .concat(generateTypings ? [] : new forkTsCheckerWebpackPlugin()), // only add if transpileOnly is true
        resolve: {
            extensions: ['.ts', '.js', '.json'],
            mainFields: ['main'], //This is fix for this issue https://www.gitmemory.com/issue/bitinn/node-fetch/450/494475397
        },
        target: 'node',
        node: {
            __dirname: false,
        },
        output: {
            path: path.resolve('./dist'),
            filename: '[name].js',
            libraryTarget: 'umd',
        },
    };
}

module.exports = (env) => {
    const version = env?.version ?? 'dev';
    console.log(`Building for version : ${version}`);

    return [
        {
            ...getCommonConfig(version, false),
            name: 'ai-scan-cli',
            entry: {
                ['ai-scan-cli']: path.resolve('./src/cli.ts'),
            },
        },
        {
            ...getCommonConfig(version, true),
            name: 'ai-scan',
            entry: {
                ['index']: path.resolve('./src/index.ts'),
            },
        },
    ];
};
