"use strict";
exports.__esModule = true;
exports.DataSchema = void 0;
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
var ts_jsonschema_builder_1 = require("@justeat/ts-jsonschema-builder");
var Ajv = require("ajv");
var DataSchema = /** @class */ (function () {
    function DataSchema(schemaName, bonusRewardPercentage, bonusRewardHexIds, schema) {
        this.schemaName = schemaName;
        this.bonusRewardPercentage = bonusRewardPercentage;
        this.bonusRewardHexIds = bonusRewardHexIds;
        this.schema = schema;
    }
    DataSchema.createNewSchema = function (schemaName, bonusRewardPercentage, bonusRewardHexIds, schema) {
        return new DataSchema(schemaName, bonusRewardPercentage, bonusRewardHexIds, schema);
    };
    DataSchema.validate = function (report, schema) {
        var ajv = new Ajv({ schemaId: "id" });
        ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
        var validate_report = ajv.compile(JSON.parse(schema.toSchemaString()));
        return validate_report(report.data);
    };
    DataSchema.prototype.toString = function () {
        return JSON.stringify(this.toDTO());
    };
    DataSchema.prototype.toSchemaString = function () {
        return JSON.stringify(this.schema.build());
    };
    DataSchema.fromDTO = function (dto) {
        return new DataSchema(dto.schemaName, dto.bonusRewardPercentage, dto.bonusRewardHexIds, new ts_jsonschema_builder_1.Schema(JSON.parse(dto.schema)));
    };
    DataSchema.prototype.toDTO = function () {
        return {
            schemaName: this.schemaName,
            bonusRewardPercentage: this.bonusRewardPercentage,
            bonusRewardHexIds: this.bonusRewardHexIds,
            schema: JSON.stringify(this.schema.build())
        };
    };
    return DataSchema;
}());
exports.DataSchema = DataSchema;
