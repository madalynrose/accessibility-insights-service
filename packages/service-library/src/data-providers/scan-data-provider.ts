// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { CosmosContainerClient, cosmosContainerClientTypes } from 'azure-services';
import { inject, injectable } from 'inversify';
import { ItemType, OnDemandPageScanBatchRequest, ScanRunBatchRequest } from 'storage-documents';
import { PartitionKeyFactory } from '../factories/partition-key-factory';

@injectable()
export class ScanDataProvider {
    public constructor(
        @inject(cosmosContainerClientTypes.OnDemandScanBatchRequestsCosmosContainerClient)
        private readonly cosmosContainerClient: CosmosContainerClient,
        @inject(PartitionKeyFactory) private readonly partitionKeyFactory: PartitionKeyFactory,
    ) {}

    public async writeScanRunBatchRequest(batchId: string, scanRequests: ScanRunBatchRequest[]): Promise<void> {
        const scanRunBatchRequest: OnDemandPageScanBatchRequest = {
            id: batchId,
            itemType: ItemType.scanRunBatchRequest,
            partitionKey: this.getPartitionKey(batchId),
            scanRunBatchRequest: scanRequests,
        };

        await this.cosmosContainerClient.writeDocument(scanRunBatchRequest);
    }

    public async deleteBatchRequest(batchRequest: OnDemandPageScanBatchRequest): Promise<void> {
        await this.cosmosContainerClient.deleteDocument(batchRequest.id, batchRequest.partitionKey);
    }

    private getPartitionKey(batchId: string): string {
        return this.partitionKeyFactory.createPartitionKeyForTransientDocument(ItemType.scanRunBatchRequest, batchId);
    }
}
