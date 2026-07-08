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

import {ItemList} from './ItemList.js';
import * as TypesetterItemDirection from './TypesetterItemDirection.js';
import {TypesetterDocument} from './TypesetterDocument.js';
import {Dimension} from "@/Dimension";

/**
 * The new typesetter class
 */


export class Typesetter {

  constructor() {
    if (this.constructor === Typesetter) {
      throw new Error("Abstract classes cannot be instantiated");
    }
  }

  static cm2px(cm: number): number {
    return Dimension.cm2px(cm);
  }

  static px2cm(px: number): number {
    return Dimension.px2cm(px);
  }

  static pt2px(pt: number): number {
    return Dimension.pt2px(pt);
  }

  static px2pt(px: number): number {
    return Dimension.px2pt(px);
  }

  /**
   * Splits a horizontal list into lines: converts a horizontal list into a vertical list
   * consisting of a series of lines of a certain width (given previously
   * to the typesetter) and inter-line glue.
   *
   */
  async typesetHorizontalList(list: ItemList): Promise<ItemList> {
    // performs type checks and returns the input list if there's no problem
    // the actual typesetting work should be done by a child of this class
    if (list.getDirection() !== TypesetterItemDirection.HorizontalItemDirection) {
      throw new Error('typesetHorizontalList called with a vertical list');
    }
    return list;
  }

  /**
   * Converts a vertical list into a horizontal list consisting of vertical lists
   * where each one fits into a given height (previously given to the typesetter).
   *
   * In essence, splits a vertical list into pages
   *
   */
  async typesetVerticalList(list: ItemList): Promise<ItemList> {
    // performs type checks and returns the input list if there's no problem
    // the actual typesetting work should be done by a child of this class
    if (list.getDirection() !== TypesetterItemDirection.VerticalItemDirection) {
      throw new Error('typesetVerticalList called with a horizontal list');
    }
    return list;
  }

  /**
   * Typesets an ItemList returning a TypesetterDocument
   *
   * Each concrete typesetter may impose constraints on the type
   * of list and items that are allowed as input. Normally,
   * the input list will be a vertical list with the paragraphs of the
   * main text block.
   *
   * The optional data parameter can be used to provide additional guiding
   * information to the typesetter
   *
   * @param {ItemList}_list
   * @param {any} _data
   * @return {Promise<TypesetterDocument>}
   */
  async typeset(_list: ItemList, _data: any = null): Promise<TypesetterDocument> {
    return new TypesetterDocument();
  }


}