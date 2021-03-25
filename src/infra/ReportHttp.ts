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

import { Observable } from "rxjs";
import { TransactionAnnounceResponse } from "symbol-sdk";
import { DataLog } from "../models/Log";

export class LogHttp {
  constructor(readonly ip: string) {}

  announceLog(): Observable<TransactionAnnounceResponse> {}

  getLogByHash(): Observable<DataLog> {}
  
  getLogsAssociatedWithAddress(): Observable<DataLog[]> {}

}
