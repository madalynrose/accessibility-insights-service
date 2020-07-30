// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import 'reflect-metadata';

import { CosmosContainerClient } from 'azure-services';
import { ItemType, OnDemandPageScanBatchRequest, ScanRunBatchRequest } from 'storage-documents';
import { IMock, It, Mock } from 'typemoq';
import { PartitionKeyFactory } from '../factories/partition-key-factory';
import { ScanDataProvider } from './scan-data-provider';

// tslint:disable: no-unsafe-any no-object-literal-type-assertion

let scanDataProvider: ScanDataProvider;
let cosmosContainerClientMock: IMock<CosmosContainerClient>;
let partitionKeyFactoryMock: IMock<PartitionKeyFactory>;

beforeEach(() => {
    cosmosContainerClientMock = Mock.ofType<CosmosContainerClient>();
    partitionKeyFactoryMock = Mock.ofType(PartitionKeyFactory);
    scanDataProvider = new ScanDataProvider(cosmosContainerClientMock.object, partitionKeyFactoryMock.object);
});

describe(ScanDataProvider, () => {
    it('write scan run batch request to a Cosmos DB', async () => {
        const batchId = 'batchId-1';
        const bucketId = 'bucket-1';
        const scanRunBatchResponse: ScanRunBatchRequest[] = [
            {
                scanId: 'scanId-1',
                url: 'url-1',
                priority: 5,
            },
        ];
        const document = {
            id: batchId,
            itemType: ItemType.scanRunBatchRequest,
            partitionKey: bucketId,
            scanRunBatchRequest: scanRunBatchResponse,
        };

        cosmosContainerClientMock.setup(async (o) => o.writeDocument(It.isValue(document))).verifiable();
        setupVerifiableGetNodeCall(bucketId, batchId);

        await scanDataProvider.writeScanRunBatchRequest(batchId, scanRunBatchResponse);

        cosmosContainerClientMock.verifyAll();
        partitionKeyFactoryMock.verifyAll();
    });

    it('delete batch request from Cosmos DB', async () => {
        const document = {
            id: 'batchId-1',
            partitionKey: 'bucket-1',
        } as OnDemandPageScanBatchRequest;
        cosmosContainerClientMock.setup(async (o) => o.deleteDocument(document.id, document.partitionKey)).verifiable();

        await scanDataProvider.deleteBatchRequest(document);

        cosmosContainerClientMock.verifyAll();
    });
});

function setupVerifiableGetNodeCall(bucket: string, ...scanIds: string[]): void {
    scanIds.forEach((scanId) => {
        partitionKeyFactoryMock
            .setup((o) => o.createPartitionKeyForTransientDocument(ItemType.scanRunBatchRequest, scanId))
            .returns(() => bucket)
            .verifiable();
    });
}
