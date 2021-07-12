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
  AccountRestrictionTransaction,
  Address,
  AddressRestrictionFlag,
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
import { CONTAINER_STATE, SCHEMA_NAME_PREFIX } from "../constants";
import { ContainerState } from "../models/ContainerState";
import { Container, DataSchema } from "../models/models";
import { WatchableTransaction, BaseTransactionBuilder } from "./BaseBuilder";

export class ContainerBuilder {
  constructor(
    readonly ip: string,
    readonly networkType: NetworkType = NetworkType.TEST_NET,
    readonly epoch: number,
    readonly generationHash: string
  ) {}

  public createContainerOwnership(
    targetAccount: Account,
    cosignatoryAccounts: Account[],
    approvalDelta: number,
    removalDelta: number
  ): WatchableTransaction {
    const unresolvedAddresses = cosignatoryAccounts.map(
      (acc) => acc.address as UnresolvedAddress
    );
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    baseBuilder.add(
      MultisigAccountModificationTransaction.create(
        Deadline.create(this.epoch),
        approvalDelta,
        removalDelta,
        unresolvedAddresses,
        [],
        this.networkType
      ),
      targetAccount.publicAccount
    );
    return baseBuilder.compile(
      targetAccount,
      this.epoch,
      this.generationHash,
      cosignatoryAccounts
    );
  }

  public setAuthorizedUsers(
    users: Address[],
    targetAccount: Account,
    remove: boolean
  ): WatchableTransaction {
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    if (remove) {
      baseBuilder.add(
        AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
          Deadline.create(this.epoch),
          AddressRestrictionFlag.AllowIncomingAddress,
          [],
          users,
          this.networkType
        ),
        targetAccount.publicAccount
      );
    } else {
      const address = Address.createFromRawAddress(users[0].plain());
      baseBuilder.add(
        AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
          Deadline.create(this.epoch),
          AddressRestrictionFlag.AllowIncomingAddress,
          [address],
          [],
          this.networkType
        ),
        targetAccount.publicAccount
      );
    }
    return baseBuilder.compile(targetAccount, this.epoch, this.generationHash);
  }

  public addMetadataToContainer(
    containerName: string,
    schema: DataSchema,
    state: ContainerState,
    targetAccount: Account
  ): WatchableTransaction {
    const id = new NamespaceId(containerName);
    const key = KeyGenerator.generateUInt64Key(
      SCHEMA_NAME_PREFIX + schema.schemaName
    );

    const stateKey = KeyGenerator.generateUInt64Key(CONTAINER_STATE);
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );

    baseBuilder.add(
      NamespaceMetadataTransaction.create(
        Deadline.create(this.epoch),
        targetAccount.address,
        stateKey,
        id,
        JSON.stringify(state.toDTO()).length,
        JSON.stringify(state.toDTO()),
        this.networkType
      ),
      targetAccount.publicAccount
    );

    baseBuilder.add(
      NamespaceMetadataTransaction.create(
        Deadline.create(this.epoch),
        targetAccount.address,
        key,
        id,
        JSON.stringify(schema.toDTO()).length,
        JSON.stringify(schema.toDTO()),
        this.networkType
      ),
      targetAccount.publicAccount
    );
    return baseBuilder.compile(targetAccount, this.epoch, this.generationHash);
  }

  public createContainerIdentity(
    container: Container,
    targetAccount: Account,
    blockTime: number = 15
  ): WatchableTransaction {
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    const namespaceId = new NamespaceId(container.name);
    const durationInBlocks = 365 * (86400 / 15);
    const duration = UInt64.fromUint(durationInBlocks); // one year
    const namespaceRegistrationTransaction =
      NamespaceRegistrationTransaction.createRootNamespace(
        Deadline.create(this.epoch),
        container.name,
        duration,
        this.networkType
      );
    const aliasTransaction = AliasTransaction.createForAddress(
      Deadline.create(this.epoch),
      AliasAction.Link,
      namespaceId,
      targetAccount.address,
      this.networkType
    );
    baseBuilder.add(
      namespaceRegistrationTransaction,
      targetAccount.publicAccount
    );
    baseBuilder.add(aliasTransaction, targetAccount.publicAccount);
    return baseBuilder.compile(targetAccount, this.epoch, this.generationHash);
  }

  public updateContainerSchema(
    name: string,
    newSchema: DataSchema,
    oldSchema: DataSchema,
    targetPublicAccount: PublicAccount,
    signer: Account
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
        Deadline.create(this.epoch),
        targetPublicAccount.address,
        key,
        id,
        newValueBytes.length - currentValueBytes.length,
        Convert.decodeHex(Convert.xor(currentValueBytes, newValueBytes)),
        this.networkType
      ),
      targetPublicAccount
    );
    return baseBuilder.compile(signer, this.epoch, this.generationHash);
  }
}
