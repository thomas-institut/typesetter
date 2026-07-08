/*
 *  Copyright (C) 2022 Universität zu Köln
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */


export type MetadataType = string | number | boolean | null | Record<string, any> | Array<MetadataType> | undefined;

export const TypesetterObjectClass = 'TypesetterObject';

export class TypesetterObject {

  /**
   * Data associated with the object.
   */
  metadata: Record<string, MetadataType> = {};

  /**
   *
   * @return {Record<string, any>}
   */
  getExportObject(): Record<string, any> {
    const obj: Record<string, any> = {class: TypesetterObjectClass};
    if (Object.keys(this.metadata).length !== 0) {
      obj.metadata = this.metadata;
    }
    return obj;
  }

  /**
   * Sets the object's values from an object
   * if mergeValues is true, current values not given in the input object
   * are preserved, otherwise default values will be used
   * @param {Record<string, any>} object
   * @param {boolean} mergeValues
   */
  setFromObject(object: Record<string, any>, mergeValues: boolean): this {
    if (!mergeValues) {
      this.metadata = {};
    }
    if (object['metadata'] !== undefined && object.metadata !== null && typeof object['metadata'] === 'object' && !Array.isArray(object['metadata'])) {
      Object.keys(object['metadata']).forEach((key) => {
        this.addMetadata(key, object['metadata'][key]);
      });
    }
    return this;
  }

  addMetadata(key: string, someThing: MetadataType) {
    this.metadata[key] = someThing;
    return this;
  }

  getMetadata(key: string): MetadataType {
    return this.metadata[key];
  }

  deleteMetadata(key: string): void {
    delete this.metadata[key];
  }

  hasMetadata(key: string): boolean {
    return this.metadata[key] !== undefined;
  }

  /**
   * Utility function to copy scalar values from an object
   * @param{Record<string, any>}template
   * @param {Record<string, any>}inputObject
   * @param {boolean} mergeValues
   * @protected
   */
  protected copyValues(template: Record<string, any>, inputObject: Record<string, any>, mergeValues: boolean) {
    Object.keys(template).forEach((key) => {
      // @ts-expect-error using string key
      const defaultValue = mergeValues ? this[key] : template[key];
      // @ts-expect-error using string key
      this[key] = inputObject[key] !== undefined ? inputObject[key] : defaultValue;
    });
  }


}