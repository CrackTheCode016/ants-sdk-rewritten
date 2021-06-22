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

import { type } from "node:os";
import { Observable } from "rxjs";
import {
  Account,
  AccountInfo,
  AggregateTransaction,
  Deadline,
  InnerTransaction,
  NetworkType,
  PublicAccount,
  RepositoryFactoryHttp,
  Transaction,
  TransactionAnnounceResponse,
} from "symbol-sdk";

export interface WatchableTransaction {
  announcable: Observable<TransactionAnnounceResponse>;
  underlyingTransaction: AggregateTransaction;
  hash: string;
}

export interface AddedTransaction {
  transaction: Transaction;
  signer: PublicAccount;
}

// TODO: make abstract class here with build method

export class BaseTransactionBuilder {
  private transactions: AddedTransaction[];
  private transactionRepository: RepositoryFactoryHttp;

  constructor(
    readonly ip: string,
    readonly isComplete: boolean,
    readonly networkType: NetworkType = NetworkType.TEST_NET
  ) {
    this.transactions = [];
    this.transactionRepository = new RepositoryFactoryHttp(ip);
  }

  /**
   * Convert an array of transactions to aggregate inner transactions
   * @param transactions - Array of transactions
   * @param signer - Signer of the transactions
   * @returns {InnerTransaction[]}
   */
  private convertToInner(
    tx: Transaction,
    signer: PublicAccount
  ): InnerTransaction {
    return tx.toAggregate(signer);
  }

  /**
   * Builds an aggregate transaction
   * @param innerTransactions - Array of transactions
   * @param signer - Signer of the transactions
   * @returns {AggregateTransaction}
   */
  private build(epoch: number): AggregateTransaction {
    const innerTransactions = this.transactions.map((t) =>
      this.convertToInner(t.transaction, t.signer)
    );
    if (this.isComplete) {
      return AggregateTransaction.createComplete(
        Deadline.create(epoch),
        innerTransactions,
        this.networkType,
        []
      );
    } else {
      // TODO: add hashlock tx
      return AggregateTransaction.createBonded(
        Deadline.create(epoch),
        innerTransactions,
        this.networkType,
        []
      );
    }
  }

  public compile(
    primarySigner: Account,
    epoch: number,
    generationHash: string,
    signers?: Account[]
  ): WatchableTransaction {
    if (this.transactions.length === 0)
      throw Error("Must have at least one transaction!");
    const aggregateTransaction = this.build(epoch);
    let signed;
    if (signers !== undefined) {
      signed = primarySigner.signTransactionWithCosignatories(
        aggregateTransaction,
        signers!,
        generationHash
      );
    } else {
      signed = primarySigner.sign(aggregateTransaction, generationHash);
    }

    if (this.isComplete) {
      return {
        announcable: this.transactionRepository
          .createTransactionRepository()
          .announce(signed),
        underlyingTransaction: aggregateTransaction,
        hash: signed.hash,
      };
    }

    return {
      announcable: this.transactionRepository
        .createTransactionRepository()
        .announceAggregateBonded(signed),
      underlyingTransaction: aggregateTransaction,
      hash: signed.hash,
    };
  }

  public add(transaction: Transaction, signer: PublicAccount) {
    this.transactions.push({ transaction: transaction, signer: signer });
  }

  public clear() {
    this.transactions = [];
  }
}
