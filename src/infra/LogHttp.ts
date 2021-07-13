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

import { asyncScheduler, Observable, scheduled } from "rxjs";
import {
  filter,
  map,
  mergeAll,
  mergeMap,
  toArray,
  zipAll,
} from "rxjs/operators";
import {
  Account,
  Address,
  AggregateTransaction,
  NamespaceId,
  NamespaceInfo,
  NetworkType,
  RepositoryFactoryHttp,
  Transaction,
  TransactionAnnounceResponse,
  TransactionGroup,
  TransactionType,
  TransferTransaction,
} from "symbol-sdk";
import { LogBuilder } from "../builders/LogBuilder";
import { REPORT_NAME_PREFIX } from "../constants";
import { DataLog } from "../models/Log";

export class LogHttp {
  private repositoryFactory: RepositoryFactoryHttp;

  constructor(
    readonly ip: string,
    readonly networkType: NetworkType = NetworkType.TEST_NET
  ) {
    this.repositoryFactory = new RepositoryFactoryHttp(ip);
  }

  announceLog(
    containerName: string,
    log: DataLog,
    sender: Account
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
                new LogBuilder(
                  this.ip,
                  this.networkType,
                  parseInt(properties.network.epochAdjustment!),
                  properties.network.generationHashSeed!
                )
            )
          ),
        this.repositoryFactory
          .createNamespaceRepository()
          .getLinkedAddress(namespaceId),
      ],
      asyncScheduler
    ).pipe(
      zipAll(),
      map((info) => {
        console.log(info);
        const builder = info[0] as LogBuilder;
        const recipient = info[1] as Address;
        return builder.createLog(log, sender, recipient).announcable;
      }),
      mergeAll()
    );
  }

  getLogByHash(id: string, schemaName: string): Observable<DataLog> {
    return this.repositoryFactory
      .createTransactionRepository()
      .getTransaction(id, TransactionGroup.Confirmed)
      .pipe(
        map((tx) => {
          if (tx.type !== TransactionType.AGGREGATE_COMPLETE)
            throw Error("Not an aggregate Transaction!");
          return tx as AggregateTransaction;
        }),
        filter((tx) => {
          const transfer = tx.innerTransactions.filter(
            (tx) => tx.type === TransactionType.TRANSFER
          )[0] as TransferTransaction;
          return (
            transfer &&
            transfer.message.payload.includes(REPORT_NAME_PREFIX + schemaName)
          );
        }),
        map((tx) => DataLog.fromTransaction(tx))
      );
  }

  getLogsAssociatedWithAddress(
    address: Address,
    containerName: string
  ): Observable<DataLog[]> {
    const searchCriteria = {
      group: TransactionGroup.Confirmed,
      address,
      pageNumber: 1,
      pageSize: 100,
    };
    const namespaceId = new NamespaceId(containerName);
    let containerAddress: Address;
    return this.repositoryFactory
      .createNamespaceRepository()
      .getLinkedAddress(namespaceId)
      .pipe(
        mergeMap((address) =>
          this.repositoryFactory
            .createAccountRepository()
            .getAccountInfo(address!)
        ),
        map((address) => (containerAddress = address.address)),
        mergeMap((_) =>
          this.repositoryFactory
            .createTransactionRepository()
            .search(searchCriteria)
        ),
        mergeMap((page) =>
          page.data.filter(
            (tx) => tx.type === TransactionType.AGGREGATE_COMPLETE
          )
        ),
        map((tx) => tx.transactionInfo!.id),
        toArray(),
        mergeMap((id) =>
          this.repositoryFactory
            .createTransactionRepository()
            .getTransactionsById(id, TransactionGroup.Confirmed)
        ),
        map((tx) =>
          tx
            .filter((tx) => {
              const aggregate = tx as AggregateTransaction;
              return (
                aggregate.innerTransactions[0] instanceof TransferTransaction &&
                aggregate.innerTransactions[0].message.payload.includes(
                  "REPORT-"
                ) &&
                (
                  aggregate.innerTransactions[0].recipientAddress as Address
                ).plain() === containerAddress.plain()
              );
            })
            .map((tx) => DataLog.fromTransaction(tx as AggregateTransaction))
        )
      );
  }
}
