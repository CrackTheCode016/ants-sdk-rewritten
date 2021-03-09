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

import { Address } from "symbol-sdk";

export interface DataLogDTO {
  name: string;
  source: string;
  data: any;
  senderAddress?: Address;
  timestamp?: string;
  hash?: string;
}

export class DataLog {
  constructor(
    readonly schemaName: string,
    readonly source: string,
    readonly data: any,
    readonly senderAddress?: Address,
    readonly timestamp?: string,
    readonly hash?: string
  ) {}

  public toDTO(): DataLogDTO {
    return {
      name: this.schemaName,
      source: this.source,
      data: this.data,
      senderAddress: this.senderAddress,
      timestamp: this.timestamp,
      hash: this.hash,
    };
  }

  public toString(): string {
    return JSON.stringify(this.toDTO());
  }

  public static fromDTO(
    dto: DataLogDTO,
    hash?: string,
    sender?: Address
  ): DataLog {
    return new DataLog(
      dto.name,
      dto.source,
      dto.data,
      sender,
      dto.timestamp,
      hash
    );
  }

  /**
   * Converts the stringifed class to an array of chunks
   */
  public chunk(increment: number = 1024): string[] {
    const payload = this.toString();
    var chunks: string[] = [];
    const chunksAmount = payload.length / increment;
    var start = 0;
    var end = increment;

    while (chunks.length < chunksAmount) {
      const chunk: string = payload.slice(start, end);
      chunks.push(chunk);
      start += increment;
      end += increment;
    }
    return chunks;
  }
}
