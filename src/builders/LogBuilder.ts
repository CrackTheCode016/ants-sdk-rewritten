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
  Deadline,
  NetworkType,
  PlainMessage,
  TransferTransaction,
} from "symbol-sdk";
import { REPORT_NAME_PREFIX } from "../constants";
import { DataLog } from "../models/Log";
import { BaseTransactionBuilder, WatchableTransaction } from "./BaseBuilder";

export class LogBuilder {
  constructor(
    readonly ip: string,
    readonly networkType: NetworkType = NetworkType.TEST_NET,
    readonly epoch: number,
    readonly generationHash: string
  ) {}

  public createLog(
    log: DataLog,
    sender: Account,
    recipient: Address
  ): WatchableTransaction {
    const baseBuilder = new BaseTransactionBuilder(
      this.ip,
      true,
      this.networkType
    );
    baseBuilder.add(
      TransferTransaction.create(
        Deadline.create(this.epoch),
        recipient,
        [],
        PlainMessage.create(REPORT_NAME_PREFIX + log.schemaName),
        this.networkType
      ),
      sender.publicAccount
    );
    const dataChunked = log.chunk();
    dataChunked.forEach((c) => {
      console.log(c);
      baseBuilder.add(
        TransferTransaction.create(
          Deadline.create(this.epoch),
          recipient,
          [],
          PlainMessage.create(c),
          this.networkType
        ),
        sender.publicAccount
      );
    });

    return baseBuilder.compile(sender, this.epoch, this.generationHash);
  }
  //   public createLogWithStateChange(): WatchableTransaction {}
}
