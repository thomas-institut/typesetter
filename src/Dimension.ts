import {trimWhiteSpace} from '@/toolbox/Util.js';
import {Typesetter} from './Typesetter.js';


export class Dimension {

  /**
   * Parses a value and unit from a string, number or null.
   *
   * - If the variable is null, returns `[0, 'px']`.
   * - If the variable is a number, returns `[someVariable, 'px']`.
   * - If the variable is a string, tries to match a number followed by an optional unit,
   *   e.g. "2em" and "2 em" both return `[2, 'em']`, "2" returns `[2, 'px']`.
   *
   * @param {string | number | null} someVariable
   * @return {[number, string]}
   */
  static parse(someVariable: string | number | null): [number, string] {
    if (someVariable === undefined || someVariable === null) {
      return [0, 'px'];
    }
    if (typeof someVariable === 'number') {
      return [someVariable, 'px'];
    }
    const str = trimWhiteSpace(String(someVariable));

    // Try to match a number followed by an optional unit
    const match = str.match(/^([+-]?\d*(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = trimWhiteSpace(match[2]) || 'px';
      if (!isNaN(value)) {
        return [value, unit];
      }
    }

    // Fallback to old split behavior if regex fails (shouldn't happen for valid inputs)
    let unit = 'px';
    const fields = str.split(' ');
    if (fields.length > 1) {
      unit = fields[1];
    }
    const value = parseFloat(fields[0]);
    return [isNaN(value) ? 0 : value, unit];
  }

  /**
   *
   * @param {string | number | null} someVariable
   * @param {number} emSize
   * @param {number} spaceSize
   */
  static str2px(someVariable: string | number | null, emSize: number = 0, spaceSize: number = 0) {
    const [value, unit] = this.parse(someVariable);
    return this.valueUnit2px(value, unit, emSize, spaceSize);
  }

  /**
   *
   * @param {string | number | null} someVariable
   * @param {number} emSize
   * @param {number} spaceSize
   * @return {number}
   */
  static str2pt(someVariable: string | number | null, emSize = 0, spaceSize = 0) {
    return Typesetter.px2pt(this.str2px(someVariable, emSize, spaceSize));
  }

  /**
   *
   * @param {string | number | null} someVariable
   * @param {number} emSize
   * @param {number} spaceSize
   * @return {number}
   */
  static str2cm(someVariable: string | number | null, emSize = 0, spaceSize = 0) {
    return Typesetter.px2cm(this.str2px(someVariable, emSize, spaceSize));
  }

  /**
   * Returns the pixel value of a dimension
   *
   * For example "2em" returns 2*emSize
   *
   * @param {string | number | null} someVariable
   * @param {number} emSize in pixels
   * @param {number} spaceSize in pixels
   * @return {number}
   */
  static getPixelValue(someVariable: string | number | null, emSize: number, spaceSize = emSize * 0.25): number {
    const [value, unit] = this.parse(someVariable);
    return this.valueUnit2px(value, unit, emSize, spaceSize);
  }


  /**
   *
   * @param {number}value
   * @param {string}unit
   * @param {number}emSize
   * @param {number}spaceSize
   * @return {number}
   */
  static valueUnit2px(value: number, unit: string, emSize: number = 0, spaceSize: number = 0): number {
    switch (unit) {
      case 'px':
        return value;

      case 'pt':
      case 'pts':
        return this.pt2px(value);

      case 'cm':
      case 'cms':
        return this.cm2px(value);

      case 'mm':
      case 'mms':
        return this.cm2px(value / 10);

      case 'em':
      case 'ems':
        return emSize * value;

      case 'sp':
        if (spaceSize === 0) {
          console.warn(`Space size is zero when converting value to pixel dimension: ${value}`);
        }
        return spaceSize * value;

      default:
        console.warn(`Invalid unit '${unit}'`);
        return -1;
    }
  }

  static cm2px(cm: number): number {
    return cm * 96 / 2.54; //   = mm * 96 [px/in] / 2.54 [cm/in]
  }

  static px2cm(px: number): number {
    return px * 2.54 / 96; //   = px * 1/96 [in/px] * 2.54 [cm/in]
  }

  static pt2px(pt: number): number {
    return pt * 4 / 3;  // = pt * 72 [pt/in] *  1/96 [in/px]
  }

  static px2pt(px: number): number {
    return px * 3 / 4;
  }

}