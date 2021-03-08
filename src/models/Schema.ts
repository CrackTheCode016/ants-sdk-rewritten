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
import { Schema } from "@justeat/ts-jsonschema-builder";
import { DataLog } from "./Log";
import * as Ajv from "ajv";

export interface DataSchemaDTO {
  schemaName: string;
  bonusRewardPercentage: number;
  bonusRewardHexIds: string[];
  schema: string;
}

export class DataSchema {
  constructor(
    readonly schemaName: string,
    readonly bonusRewardPercentage: number,
    readonly bonusRewardHexIds: string[],
    readonly schema: Schema<any>
  ) {}

  public static createNewSchema<T>(
    schemaName: string,
    bonusRewardPercentage: number,
    bonusRewardHexIds: string[],
    schema: Schema<T>
  ): DataSchema {
    return new DataSchema(
      schemaName,
      bonusRewardPercentage,
      bonusRewardHexIds,
      schema
    );
  }

  public static validate(report: DataLog, schema: DataSchema): boolean {
    const ajv = new Ajv({ schemaId: "id" });
    ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
    const validate_report = ajv.compile(JSON.parse(schema.toSchemaString()));
    return validate_report(report.data) as boolean;
  }

  public toString(): string {
    return JSON.stringify(this.toDTO());
  }

  public toSchemaString(): string {
    return JSON.stringify(this.schema.build());
  }

  public toDTO(): DataSchemaDTO {
    return {
      schemaName: this.schemaName,
      bonusRewardPercentage: this.bonusRewardPercentage,
      bonusRewardHexIds: this.bonusRewardHexIds,
      schema: JSON.stringify(this.schema.build()),
    };
  }
}
