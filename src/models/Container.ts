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
import { ContainerState, ContainerStateDTO } from "./ContainerState";
import { DataSchema, DataSchemaDTO } from "./Schema";

export interface ContainerDTO {
  name: string;
  state: ContainerStateDTO;
  authorizedReporters: Address[];
  schema: DataSchemaDTO;
  targetAccount: Address;
  owner?: Address;
}

export class Container {
  constructor(
    readonly name: string,
    readonly state: ContainerState,
    readonly authorizedReporters: Address[],
    readonly schema: DataSchema,
    readonly targetAccount: Address,
    readonly owner?: Address
  ) {
    authorizedReporters.forEach((reporter, i) => {
      if (i !== authorizedReporters.indexOf(reporter)) {
        throw Error("Duplicate reporters found");
      }
    });
  }

  public toDTO(): ContainerDTO {
    return {
      name: this.name,
      state: this.state,
      authorizedReporters: this.authorizedReporters,
      schema: this.schema.toDTO(),
      targetAccount: this.targetAccount,
      owner: this.owner,
    };
  }

  public static fromDTO(dto: ContainerDTO): Container {
    return new Container(
      dto.name,
      ContainerState.fromDTO(dto.state),
      dto.authorizedReporters,
      DataSchema.fromDTO(dto.schema),
      dto.targetAccount,
      dto.owner
    );
  }
}
