"use strict";
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
exports.__esModule = true;
exports.Container = void 0;
var ContainerState_1 = require("./ContainerState");
var Schema_1 = require("./Schema");
var Container = /** @class */ (function () {
    function Container(name, state, authorizedReporters, schema, targetAccount, owner) {
        this.name = name;
        this.state = state;
        this.authorizedReporters = authorizedReporters;
        this.schema = schema;
        this.targetAccount = targetAccount;
        this.owner = owner;
        authorizedReporters.forEach(function (reporter, i) {
            if (i !== authorizedReporters.indexOf(reporter)) {
                throw Error("Duplicate reporters found");
            }
        });
    }
    Container.prototype.toDTO = function () {
        return {
            name: this.name,
            state: this.state,
            authorizedReporters: this.authorizedReporters,
            schema: this.schema.toDTO(),
            targetAccount: this.targetAccount,
            owner: this.owner
        };
    };
    Container.fromDTO = function (dto) {
        return new Container(dto.name, ContainerState_1.ContainerState.fromDTO(dto.state), dto.authorizedReporters, Schema_1.DataSchema.fromDTO(dto.schema), dto.targetAccount, dto.owner);
    };
    return Container;
}());
exports.Container = Container;
