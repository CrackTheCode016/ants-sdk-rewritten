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
exports.ContainerState = exports.ContainerStatus = void 0;
var ContainerStatus;
(function (ContainerStatus) {
    ContainerStatus[ContainerStatus["ACTIVE"] = 0] = "ACTIVE";
    ContainerStatus[ContainerStatus["LOCKED"] = 1] = "LOCKED";
})(ContainerStatus = exports.ContainerStatus || (exports.ContainerStatus = {}));
var ContainerState = /** @class */ (function () {
    function ContainerState(lastTimestamp, latestLogHash, status) {
        this.lastTimestamp = lastTimestamp;
        this.latestLogHash = latestLogHash;
        this.status = status;
    }
    ContainerState.prototype.toDTO = function () {
        return {
            lastTimestamp: this.lastTimestamp,
            latestLogHash: this.latestLogHash,
            status: this.status
        };
    };
    ContainerState.fromDTO = function (dto) {
        return new ContainerState(dto.lastTimestamp, dto.latestLogHash, dto.status);
    };
    return ContainerState;
}());
exports.ContainerState = ContainerState;
