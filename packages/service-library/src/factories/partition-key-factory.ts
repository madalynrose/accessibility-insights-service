// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { GuidGenerator, HashGenerator } from 'common';
import { inject, injectable } from 'inversify';
import { ItemType } from 'storage-documents';

@injectable()
export class PartitionKeyFactory {
    constructor(
        @inject(HashGenerator) private readonly hashGenerator: HashGenerator,
        @inject(GuidGenerator) private readonly guidGenerator: GuidGenerator,
    ) {}

    public get transientContainerBucketRange(): number {
        // changing buckets range may affect partition key generation for the same values
        return 10;
    }

    public createPartitionKeyForDocument(documentType: ItemType, documentId: string): string {
        const node = this.guidGenerator.getGuidNode(documentId);

        return this.hashGenerator.getDbHashBucket(documentType, node);
    }

    public createPartitionKeyForTransientDocument(documentType: ItemType, documentId: string): string {
        const node = this.guidGenerator.getGuidNode(documentId);

        return this.hashGenerator.getDbHashBucketWithRange(documentType, this.transientContainerBucketRange, node);
    }
}
