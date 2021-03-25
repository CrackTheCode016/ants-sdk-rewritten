/*
 * (C) Copyright 2021 IoDLT (http://iodlt.com/).
 *
 * Licensed under GPL v3 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 *     - Bader Youssef <bader@iodlt.com>
 */

import {
  Account,
  Address,
  AliasAction,
  AliasTransaction,
  Convert,
  Deadline,
  KeyGenerator,
  MultisigAccountModificationTransaction,
  NamespaceId,
  NamespaceMetadataTransaction,
  NamespaceRegistrationTransaction,
  NetworkType,
  PublicAccount,
  UInt64,
  UnresolvedAddress,
} from "symbol-sdk";
import { SCHEMA_NAME_PREFIX } from "../constants";
import { Container, DataSchema } from "../models/models";
import { WatchableTransaction, BaseTransactionBuilder } from "./BaseBuilder";

export class ContainerBuilder {
  constructor(
    readonly ip: string,
    readonly networkType: NetworkType = NetworkType.TEST_NET
  ) {}

  public createContainerOwnership(
    targetAccount: Account,
    cosignatoryPublicAccounts: PublicAccount[],
    approvalDelta: number,
    removalDelta: number,
    epoch: number,
    generationHash: string
  ): WatchableTransaction {
    const unresolvedAddresses = cosignatoryPublicAccounts.map(
      (acc) => acc.address as UnresolvedAddress
    );
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    baseBuilder.add(
      MultisigAccountModificationTransaction.create(
        Deadline.create(epoch),
        approvalDelta,
        removalDelta,
        unresolvedAddresses,
        [],
        this.networkType
      ),
      targetAccount.publicAccount
    );
    return baseBuilder.compile(targetAccount, epoch, generationHash);
  }

  public addSchemaToContainer(
    containerName: string,
    schema: DataSchema,
    epoch: number,
    generationHash: string,
    targetAccount: Account
  ): WatchableTransaction {
    const id = new NamespaceId(containerName);
    const key = KeyGenerator.generateUInt64Key(
      SCHEMA_NAME_PREFIX + schema.schemaName
    );
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    baseBuilder.add(
      NamespaceMetadataTransaction.create(
        Deadline.create(epoch),
        targetAccount.address,
        key,
        id,
        JSON.stringify(schema.toDTO()).length,
        JSON.stringify(schema.toDTO()),
        this.networkType
      ),
      targetAccount.publicAccount
    );
    return baseBuilder.compile(targetAccount, epoch, generationHash);
  }

  public createContainerMetaAssignment(
    container: Container,
    epoch: number,
    generationHash: string,
    targetAccount: Account,
    blockTime: number = 15
  ): WatchableTransaction {
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    const namespaceId = new NamespaceId(container.name);
    const durationInBlocks = 365 * (86400 / blockTime);
    const duration = UInt64.fromUint(durationInBlocks); // one year
    const namespaceRegistrationTransaction = NamespaceRegistrationTransaction.createRootNamespace(
      Deadline.create(epoch),
      container.name,
      duration,
      this.networkType
    );
    const aliasTransaction = AliasTransaction.createForAddress(
      Deadline.create(epoch),
      AliasAction.Link,
      namespaceId,
      targetAccount.address,
      this.networkType
    );
    baseBuilder.add(aliasTransaction, targetAccount.publicAccount);
    baseBuilder.add(
      namespaceRegistrationTransaction,
      targetAccount.publicAccount
    );
    return baseBuilder.compile(targetAccount, epoch, generationHash);
  }

  public updateContainerSchema(
    name: string,
    newSchema: DataSchema,
    oldSchema: DataSchema,
    targetPublicAccount: PublicAccount,
    signer: Account,
    epoch: number,
    generationHash: string
  ): WatchableTransaction {
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    const key = KeyGenerator.generateUInt64Key(
      SCHEMA_NAME_PREFIX + oldSchema.schemaName
    );
    const newValueBytes = Convert.utf8ToUint8(
      JSON.stringify(newSchema.toDTO())
    );
    const currentValueBytes = Convert.utf8ToUint8(
      JSON.stringify(oldSchema.toDTO())
    );
    const id = new NamespaceId(name);

    baseBuilder.add(
      NamespaceMetadataTransaction.create(
        Deadline.create(epoch),
        targetPublicAccount.address,
        key,
        id,
        newValueBytes.length - currentValueBytes.length,
        Convert.decodeHex(Convert.xor(currentValueBytes, newValueBytes)),
        this.networkType
      ),
      targetPublicAccount
    );
    return baseBuilder.compile(signer, epoch, generationHash);
  }
}
