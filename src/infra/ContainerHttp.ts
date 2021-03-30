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

import { asyncScheduler, from, Observable, scheduled } from "rxjs";
import {
  Account,
  IListener,
  KeyGenerator,
  MetadataType,
  NamespaceId,
  NetworkType,
  NamespaceInfo,
  RepositoryFactoryHttp,
  TransactionAnnounceResponse,
  Address,
  AccountInfo,
  TransactionGroup,
  TransactionSearchCriteria,
  TransactionType,
  AggregateTransaction,
  TransferTransaction,
} from "symbol-sdk";
import { ContainerBuilder } from "../builders/ContainerBuilder";
import { DataLog } from "../models/Log";
import { Container, DataSchema } from "../models/models";
import { mergeMap, map, mergeAll, filter, toArray } from "rxjs/operators";
import { ContainerState } from "../models/ContainerState";
import {
  CONTAINER_STATE,
  REPORT_NAME_PREFIX,
  SCHEMA_NAME_PREFIX,
} from "../constants";

export class ContainerHttp {
  private repositoryFactory: RepositoryFactoryHttp;
  private listener: IListener;

  constructor(
    readonly ip: string,
    readonly networkType: NetworkType = NetworkType.TEST_NET
  ) {
    this.repositoryFactory = new RepositoryFactoryHttp(ip);
    this.listener = this.repositoryFactory.createListener();
  }

  publishContainer(
    container: Container,
    initalOwner: Account,
    targetAccount: Account
  ): Observable<TransactionAnnounceResponse> {
    return from(this.listener.open()).pipe(
      map(() =>
        this.repositoryFactory
          .createNetworkRepository()
          .getNetworkProperties()
          .pipe(
            map(
              (properties) =>
                new ContainerBuilder(
                  this.ip,
                  this.networkType,
                  parseInt(properties.network.epochAdjustment!),
                  properties.network.generationHashSeed!
                )
            ),
            mergeMap((builder) => {
              const ownership = builder.createContainerOwnership(
                targetAccount,
                [initalOwner.publicAccount],
                1,
                1
              );

              const metadata = builder.createContainerMetaAssignment(
                container,
                targetAccount
              );

              const addSchema = builder.addSchemaToContainer(
                container.name,
                container.schema,
                targetAccount
              );

              return metadata.announcable.pipe(
                mergeMap((_) =>
                  this.listener.confirmed(targetAccount.address, metadata.hash)
                ),
                mergeMap((_) => addSchema.announcable),
                mergeMap((_) =>
                  this.listener.confirmed(targetAccount.address, addSchema.hash)
                ),
                mergeMap((_) => ownership.announcable)
              );
            })
          )
      ),
      mergeAll()
    );
  }

  editContainerSchema(
    owner: Account,
    containerName: string,
    newSchema: DataSchema
  ): Observable<TransactionAnnounceResponse> {
    const namespaceId = new NamespaceId(containerName);
    return scheduled(
      [
        this.repositoryFactory
          .createNetworkRepository()
          .getNetworkProperties()
          .pipe(
            map(
              (properties) =>
                new ContainerBuilder(
                  this.ip,
                  this.networkType,
                  parseInt(properties.network.epochAdjustment!),
                  properties.network.generationHashSeed!
                )
            )
          ),
        this.getSchemaFromContainer(containerName),

        this.repositoryFactory
          .createNamespaceRepository()
          .getLinkedAddress(namespaceId)
          .pipe(
            mergeMap((address) =>
              this.repositoryFactory
                .createAccountRepository()
                .getAccountInfo(address!)
            )
          ),
      ],
      asyncScheduler
    ).pipe(
      map((info) => {
        const builder = info[0] as ContainerBuilder;
        const oldSchema = info[1] as DataSchema;
        const publicAccount = info[2] as AccountInfo;
        return builder.updateContainerSchema(
          containerName,
          newSchema,
          oldSchema,
          publicAccount.publicAccount,
          owner
        ).announcable;
      }),
      mergeAll()
    );
  }

  getContainerByName(containerName: string): Observable<Container> {
    const namespaceId = new NamespaceId(containerName);
    return scheduled(
      [
        this.repositoryFactory
          .createNamespaceRepository()
          .getNamespace(namespaceId),
        this.getAuthorizedReporters(containerName),
        this.getSchemaFromContainer(containerName),
        this.getContainerState(containerName),
        this.repositoryFactory
          .createNamespaceRepository()
          .getLinkedAddress(namespaceId),
      ],
      asyncScheduler
    ).pipe(
      mergeAll(),
      map((info) => {
        const state = info![3] as ContainerState;
        const auth = info![1] as Address[];
        const schema = info![2] as DataSchema;
        const namespaceInfo = info![0] as NamespaceInfo;
        const address = info![4] as Address;
        return new Container(
          containerName,
          state,
          auth,
          schema,
          namespaceInfo.ownerAddress,
          address
        );
      })
    );
  }

  getSchemaFromContainer(containerName: string): Observable<DataSchema> {
    const namespaceId = new NamespaceId(containerName);
    const searchCriteria = {
      targetId: namespaceId,
      metadataType: MetadataType.Namespace,
    };
    return this.repositoryFactory
      .createMetadataRepository()
      .search(searchCriteria)
      .pipe(
        mergeMap((page) => page.data),
        filter((data) =>
          data.metadataEntry.value.startsWith(SCHEMA_NAME_PREFIX)
        ),
        map((data) => DataSchema.fromDTO(JSON.parse(data.metadataEntry.value)))
      );
  }

  getContainerState(containerName: string): Observable<ContainerState> {
    const namespaceId = new NamespaceId(containerName);
    const key = KeyGenerator.generateUInt64Key(CONTAINER_STATE);
    const searchCriteria = {
      targetId: namespaceId,
      metadataType: MetadataType.Namespace,
    };
    return this.repositoryFactory
      .createMetadataRepository()
      .search(searchCriteria)
      .pipe(
        mergeMap((page) => page.data),
        filter(
          (data) =>
            data.metadataEntry.scopedMetadataKey.toString() === key.toString()
        ),
        map((data) =>
          ContainerState.fromDTO(JSON.parse(data.metadataEntry.value))
        )
      );
  }

  getAuthorizedReporters(containerName: string): Observable<Address[]> {
    const namespaceId = new NamespaceId(containerName);
    return this.repositoryFactory
      .createNamespaceRepository()
      .getLinkedAddress(namespaceId)
      .pipe(
        mergeMap((address) =>
          this.repositoryFactory
            .createRestrictionAccountRepository()
            .getAccountRestrictions(address as Address)
        ),
        mergeMap((restrictions) => restrictions.restrictions.values)
      );
  }

  getLogsForContainer(containerName: string): Observable<DataLog[]> {
    const namespaceId = new NamespaceId(containerName);
    return this.repositoryFactory
      .createNamespaceRepository()
      .getLinkedAddress(namespaceId)
      .pipe(
        mergeMap((address) => {
          const a = address as Address;
          const searchCriteria: TransactionSearchCriteria = {
            group: TransactionGroup.Confirmed,
            address: a,
            pageNumber: 1,
            pageSize: 100,
          };
          return this.repositoryFactory
            .createTransactionRepository()
            .search(searchCriteria);
        }),
        mergeMap((page) => {
          return page.data.filter(
            (tx) => tx.type === TransactionType.AGGREGATE_COMPLETE
          );
        }),
        map((tx) => tx.transactionInfo!.id),
        toArray(),
        mergeMap((id) =>
          this.repositoryFactory
            .createTransactionRepository()
            .getTransactionsById(id, TransactionGroup.Confirmed)
        ),
        mergeMap((tx) => tx),
        filter((tx) => {
          const aggregate = tx as AggregateTransaction;
          const transfer = aggregate.innerTransactions.filter(
            (tx) => tx.type === TransactionType.TRANSFER
          )[0] as TransferTransaction;
          return (
            transfer && transfer.message.payload.includes(REPORT_NAME_PREFIX)
          );
        }),
        map((tx) => {
          return DataLog.fromTransaction(tx as AggregateTransaction);
        }),
        toArray()
      );
  }

  //   editContainerRestrictions(): Observable<
  //     TransactionAnnounceResponse | TransactionStatusError
  //   >;
}
