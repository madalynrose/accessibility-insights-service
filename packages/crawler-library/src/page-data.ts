// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface PageData {
    title: string;
    url: string;
    succeeded: boolean;
    error?: string;
    requestErrors?: string;
}
