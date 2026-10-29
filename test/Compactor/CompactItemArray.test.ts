import {describe, expect, it} from "vitest";
import {getFakeBidiOrder} from "../FakeStringTextDirection";
import {compactItemArray} from "@/Compactor/CompactItemArray";
import {TextBox} from "@/TextBox";
import {MergedItem, SourceItems} from "@/MetadataKey";
import {ObjectFactory} from "@/ObjectFactory";
import {TypesetterItem} from "@/TypesetterItem";
import {createItemArrayFromString} from "@/ItemArrayFromString";
import {ItemArrayWithBidiOrderInfo} from "@/LineBreaker/FirstFitLineBreaker";
import {BidiOrderInfo} from "@/Bidi/BidiOrderInfo";

interface CompactTestCaseData {
  testStrings: string[];
  expectedTextBoxes: string[];
}

describe('Compact Item Array', () => {
  it('should compact a large unmergeable level run', () => {
    const itemCount = 150_000;
    const itemArray = Array.from({length: itemCount}, (_, index) =>
      new TextBox()
        .setText(String(index))
        .setFontFamily(index % 2 === 0 ? 'FontA' : 'FontB'));
    const bidiOrderInfoArray = createBidiOrderInfoArray(itemCount);

    const compacted = compactItemArray({itemArray, bidiOrderInfoArray});

    expect(compacted.itemArray).toHaveLength(itemCount);
    expect(compacted.itemArray.every((item, index) => item === itemArray[index])).toBe(true);
    expect(compacted.bidiOrderInfoArray.every((info, index) =>
      info.inputIndex === index && info.displayOrder === index)).toBe(true);
  });

  it.each(['left', 'right'] as const)('should append a large source metadata array from the %s item', (sourceSide) => {
    const sourceItems = Array.from({length: 150_000}, (_, index) => ({index}));
    const leftItem = new TextBox().setText('left');
    const rightItem = new TextBox().setText('right');
    (sourceSide === 'left' ? leftItem : rightItem).addMetadata(SourceItems, sourceItems);
    const itemArray = [leftItem, rightItem];
    const bidiOrderInfoArray = createBidiOrderInfoArray(itemArray.length);

    const compacted = compactItemArray({itemArray, bidiOrderInfoArray});
    const mergedSourceItems = compacted.itemArray[0].getMetadata(SourceItems) as object[];

    expect(compacted.itemArray).toHaveLength(1);
    expect(mergedSourceItems).toHaveLength(sourceItems.length + 1);
    expect(sourceItems).toHaveLength(150_000);
    const sourceOffset = sourceSide === 'left' ? 0 : 1;
    expect(sourceItems.every((sourceItem, index) =>
      mergedSourceItems[index + sourceOffset] === sourceItem)).toBe(true);
  });

  it('should compact text', () => {
    const TestCases: CompactTestCaseData[] = [
      {testStrings: ['A simple string', '.', '.'], expectedTextBoxes: ['A', 'simple', 'string..']},
    ];

    TestCases.forEach(tc => {
      const {testStrings, expectedTextBoxes} = tc;
      const itemArray: TypesetterItem[] =[];
      testStrings.forEach(testString => {
        itemArray.push(...createItemArrayFromString(testString));
      })
      const info:ItemArrayWithBidiOrderInfo = {itemArray, bidiOrderInfoArray: getFakeBidiOrder(itemArray, 'ltr')};
      const compacted = compactItemArray(info);
      const textArray = compacted.itemArray
      .filter(item => item instanceof TextBox)
      .map(tb => tb.getText());
      expect(textArray).toEqual(expectedTextBoxes);
      // check that source items are all non-merged items
      compacted.itemArray.forEach(item => {
        if (item.hasMetadata(MergedItem)) {
          (item.getMetadata(SourceItems) as object[])
          .map(si  => ObjectFactory.fromObject(si))
          .map(si => expect(si.hasMetadata(MergedItem)).toBe(false));
        }
      });
    });
  });

  it('should preserve metadata in source items', () => {
    const TestStrings = ['This is', 'a test string', 'with metadata'];
    const TestMetadataKey = 'MyData';
    let itemArray: TypesetterItem[] = [];
    TestStrings.forEach(testString => {
      itemArray.push(...createItemArrayFromString(testString));
    })

    itemArray = itemArray.map((item, index) => {
      item.addMetadata(TestMetadataKey, index);
      return item;
    });
    const info: ItemArrayWithBidiOrderInfo = { itemArray: itemArray, bidiOrderInfoArray: getFakeBidiOrder(itemArray, 'ltr')};

    const compacted = compactItemArray(info);

    compacted.itemArray.forEach( (item) => {
      if (item.hasMetadata(MergedItem)) {
        // expect(item.hasMetadata(TestMetadataKey)).toBe(false);
        (item.getMetadata(SourceItems) as object[]).map( si => ObjectFactory.fromObject(si) ).forEach( si => {
          expect(si.hasMetadata(TestMetadataKey)).toBe(true);
        })
      } else {
        expect(item.hasMetadata(TestMetadataKey)).toBe(true);
      }
    })
  })
});

function createBidiOrderInfoArray(itemCount: number): BidiOrderInfo[] {
  return Array.from({length: itemCount}, (_, index) => ({
    inputIndex: index,
    displayOrder: index,
    intrinsicTextDirection: 'ltr',
    textDirection: 'ltr',
    embeddingLevel: 0,
  }));
}