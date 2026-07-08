import {ItemList} from '@/ItemList';
import {TypesetterItem} from "@/TypesetterItem";
import {TextBoxMeasurer} from "@/TextBoxMeasurer";
import {BidiOrderInfo} from "@/Bidi";

export class LineBreaker {
  constructor() {
    if (this.constructor === LineBreaker) {
      throw new Error("Abstract classes cannot be instantiated");
    }
  }

  /**
   *
   * @param {TypesetterItem[]}itemArray
   * @param _lineWidth
   * @param _textBoxMeasurer
   * @param _bidiOrderInfoArray
   * @return {Promise<ItemList[]>}
   */
  static breakIntoLines(itemArray: TypesetterItem[], _lineWidth: number, _textBoxMeasurer: TextBoxMeasurer, _bidiOrderInfoArray: BidiOrderInfo[]): Promise<ItemList[]> {
    // do nothing
    const theList = new ItemList();
    theList.setList(itemArray);
    return Promise.resolve([theList]);
  }
}