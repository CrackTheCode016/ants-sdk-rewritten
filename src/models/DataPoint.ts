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

export interface DataPointDTO {
  key: string;
  value: any | any[];
}

export class DataPoint {
  constructor(readonly key: string, readonly value: any) {}

  public static fromDTO(dto: DataPointDTO): DataPoint {
    return new DataPoint(dto.key, dto.value);
  }

  public toDTO(): DataPointDTO {
    return {
      key: this.key,
      value: this.value,
    };
  }
}
