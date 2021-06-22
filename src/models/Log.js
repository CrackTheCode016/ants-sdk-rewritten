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
exports.DataLog = void 0;
var DataLog = /** @class */ (function () {
    function DataLog(schemaName, source, data, senderAddress, timestamp, hash) {
        this.schemaName = schemaName;
        this.source = source;
        this.data = data;
        this.senderAddress = senderAddress;
        this.timestamp = timestamp;
        this.hash = hash;
    }
    DataLog.prototype.toDTO = function () {
        return {
            name: this.schemaName,
            source: this.source,
            data: this.data,
            senderAddress: this.senderAddress,
            timestamp: this.timestamp,
            hash: this.hash
        };
    };
    DataLog.prototype.toString = function () {
        return JSON.stringify(this.toDTO());
    };
    DataLog.fromDTO = function (dto, hash, sender) {
        return new DataLog(dto.name, dto.source, dto.data, sender, dto.timestamp, hash);
    };
    DataLog.fromTransaction = function (tx) {
        var _a, _b;
        tx.innerTransactions.splice(0, 1);
        var reportString = tx.innerTransactions
            .map(function (t) {
            var transfer = t;
            return transfer.message.payload;
        })
            .join("")
            .replace("\n", "");
        try {
            return DataLog.fromDTO(JSON.parse(reportString), (_a = tx.transactionInfo) === null || _a === void 0 ? void 0 : _a.hash, (_b = tx.signer) === null || _b === void 0 ? void 0 : _b.address);
        }
        catch (e) {
            throw new Error("Report is not proper JSON");
        }
    };
    /**
     * Converts the stringifed class to an array of chunks
     */
    DataLog.prototype.chunk = function (increment) {
        if (increment === void 0) { increment = 1024; }
        var payload = this.toString();
        var chunks = [];
        var chunksAmount = payload.length / increment;
        var start = 0;
        var end = increment;
        while (chunks.length < chunksAmount) {
            var chunk = payload.slice(start, end);
            chunks.push(chunk);
            start += increment;
            end += increment;
        }
        return chunks;
    };
    return DataLog;
}());
exports.DataLog = DataLog;
