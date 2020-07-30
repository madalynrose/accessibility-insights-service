// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import 'reflect-metadata';

import { GuidGenerator, HashGenerator } from 'common';
import { ItemType } from 'storage-documents';
import { IMock, Mock } from 'typemoq';
import { PartitionKeyFactory } from './partition-key-factory';

const documentId = 'documentId-1';
const partitionKeyResult = 'itemType-1';
const scanIdNode = 'scanIdNode-1';
let hashGeneratorMock: IMock<HashGenerator>;
let guidGeneratorMock: IMock<GuidGenerator>;
let partitionKeyFactory: PartitionKeyFactory;

beforeEach(() => {
    hashGeneratorMock = Mock.ofType(HashGenerator);
    guidGeneratorMock = Mock.ofType(GuidGenerator);
    partitionKeyFactory = new PartitionKeyFactory(hashGeneratorMock.object, guidGeneratorMock.object);
});

afterEach(() => {
    guidGeneratorMock.verifyAll();
    hashGeneratorMock.verifyAll();
});

describe(PartitionKeyFactory, () => {
    it('create partition key for the storage document', () => {
        guidGeneratorMock
            .setup((g) => g.getGuidNode(documentId))
            .returns(() => scanIdNode)
            .verifiable();
        hashGeneratorMock
            .setup((h) => h.getDbHashBucket(ItemType.onDemandPageScanRequest, scanIdNode))
            .returns(() => partitionKeyResult)
            .verifiable();

        const partitionKey = partitionKeyFactory.createPartitionKeyForDocument(ItemType.onDemandPageScanRequest, documentId);
        expect(partitionKey).toEqual(partitionKeyResult);
    });

    it('create partition key for the transient document', () => {
        guidGeneratorMock
            .setup((g) => g.getGuidNode(documentId))
            .returns(() => scanIdNode)
            .verifiable();
        hashGeneratorMock
            .setup((h) => h.getDbHashBucketWithRange(ItemType.scanRunBatchRequest, 10, scanIdNode))
            .returns(() => partitionKeyResult)
            .verifiable();

        const partitionKey = partitionKeyFactory.createPartitionKeyForTransientDocument(ItemType.scanRunBatchRequest, documentId);
        expect(partitionKey).toEqual(partitionKeyResult);
    });
});
