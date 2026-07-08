
import {ItemList} from './ItemList.js';
import {TextBox} from './TextBox.js';
import {ScriptAndTextDirectionDetector} from '@/toolbox/ScriptAndTextDirectionDetector';
import {FontConversionDefinition} from "@/Style";


export class FontConversions {

  /**
   * Applies the first matching font conversion definition from the given array to the given item
   * A font conversion definition is an object containing the format to match and the conversion required.
   * For example:
   *    {  from:  { fontFamily: 'FreeSerif', fontStyle: 'italic'}, to: {fontFamily: 'FancyFreeSerifFont'} }
   * @param item
   * @param fontConversionDefinitions
   * @param {string}defaultScript  Default script when script cannot be detected
   */
  static applyFontConversions<T>(item: T, fontConversionDefinitions: FontConversionDefinition[], defaultScript: string = 'la'): T {
    if (fontConversionDefinitions.length === 0) {
      // shortcut to avoid further comparisons
      return item;
    }
    if (item instanceof ItemList) {
      item.setList(item.getList().map((item) => {
        return this.applyFontConversions(item, fontConversionDefinitions);
      }));
      return item;
    }
    if (item instanceof TextBox) {
      const match = this.findMatch(item, fontConversionDefinitions, defaultScript);
      if (match !== null) {
        if (match.to.fontFamily !== undefined) {
          item.setFontFamily(match.to.fontFamily);
        }
        if (match.to.fontStyle !== undefined) {
          item.setFontStyle(match.to.fontStyle);
        }
        if (match.to.fontWeight !== undefined) {
          item.setFontWeight(match.to.fontWeight);
        }
        if (match.to.fontSizeFactor !== undefined) {
          item.setFontSize(item.getFontSize() * match.to.fontSizeFactor);
        }
        return item;
      }
      return item;
    }
    // any other type
    return item;
  }

  private static findMatch(textBoxItem: TextBox, fontConversionDefinitions: FontConversionDefinition[], defaultScript: string) {
    let match = null;
    for (let i = 0; match === null && i < fontConversionDefinitions.length; i++) {
      const def = fontConversionDefinitions[i];
      if (def.from === undefined || def.to === undefined) {
        continue;
      }
      const attributesToMatch = ['fontFamily', 'fontWeight', 'fontStyle'];
      let matchFound = true;
      for (let j = 0; j < attributesToMatch.length; j++) {
        const attr = attributesToMatch[j];
        // @ts-expect-error Accessing TextBox members as array
        if (def.from[attr] === undefined) {
          continue;
        }
        // @ts-expect-error Accessing TextBox members as array
        if (textBoxItem[attr] !== def.from[attr]) {
          // console.log(`Mismatch`)
          matchFound = false;
          break;
        }
      }
      if (!matchFound) {
        match = null;
        continue;
      }
      // style attributes match, check the script
      if (def.from.script !== undefined) {
        const ld = new ScriptAndTextDirectionDetector(defaultScript);
        const textScript = ld.detectScript(textBoxItem.getText());
        if (textScript === def.from.script) {
          match = def;
        } else {
          match = null;
        }
      } else {
        match = def;
      }

    }
    return match;
  }
}