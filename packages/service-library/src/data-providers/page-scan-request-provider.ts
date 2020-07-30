// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { CosmosContainerClient, cosmosContainerClientTypes, CosmosOperationResponse } from 'azure-services';
import { inject, injectable } from 'inversify';
import { ItemType, OnDemandPageScanRequest, PartitionKey } from 'storage-documents';

@injectable()
export class PageScanRequestProvider {
    constructor(
        @inject(cosmosContainerClientTypes.OnDemandScanRequestsCosmosContainerClient)
        private readonly cosmosContainerClient: CosmosContainerClient,
    ) {}

    public async getRequests(
        continuationToken?: string,
        itemCount: number = 100,
    ): Promise<CosmosOperationResponse<OnDemandPageScanRequest[]>> {
        const query = `SELECT TOP ${itemCount} * FROM c WHERE STARTSWITH(c.partitionKey, '${PartitionKey.pageScanRequestDocuments}', true) and c.itemType = '${ItemType.onDemandPageScanRequest}' ORDER BY c.priority desc`;

        return this.cosmosContainerClient.queryDocuments<OnDemandPageScanRequest>(query, continuationToken);
    }

    public async writeRequests(requests: OnDemandPageScanRequest[]): Promise<void> {
        return this.cosmosContainerClient.writeDocuments(requests);
    }

    public async deleteRequests(requests: OnDemandPageScanRequest[]): Promise<void> {
        await Promise.all(
            requests.map(async (request) => {
                await this.cosmosContainerClient.deleteDocument(request.id, request.partitionKey);
            }),
        );
    }
}
