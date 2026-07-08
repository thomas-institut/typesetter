import {describe, expect, it, vi} from 'vitest';
import {AddMarginalia} from '@/PageProcessor/AddMarginalia';
import {ItemList} from '@/ItemList';
import {TypesetterPage} from '@/TypesetterPage';
import {HorizontalItemDirection, VerticalItemDirection} from '@/TypesetterItemDirection';
import * as MetadataKey from '@/MetadataKey';
import * as ListType from '@/ListType';
import {LineNumberData} from '@/MainTextLineData';
import {TextBox} from '@/TextBox';
import {Glue} from '@/Glue';
import {TextBoxFactory} from '@/TextBoxFactory';

vi.mock('@/Typesetter', () => {
  return {
    Typesetter: {
      pt2px: (value: number) => value,
    },
  };
});

function createMainTextList(lineHeights: number[], shiftY = 30): ItemList {
  const mainTextList = new ItemList(VerticalItemDirection);
  mainTextList.setShiftY(shiftY);
  lineHeights.forEach((height) => {
    const line = new ItemList(HorizontalItemDirection);
    line.setHeight(height);
    mainTextList.pushItem(line);
  });
  return mainTextList;
}

describe('AddMarginalia', () => {
  const measurer = {
    getBoxWidth: vi.fn(async (item: TextBox) => item.getText().length * 10),
    getBoxHeight: vi.fn(async () => 10),
  };

  it('adds marginalia aligned with main text lines', async () => {
    const mainTextList = createMainTextList([15, 15, 15], 50);
    const lineData: LineNumberData[] = [
      {listIndex: 0, lineNumber: 1, y: 0, lineNumberToShow: 0},
      {listIndex: 1, lineNumber: 2, y: 15, lineNumberToShow: 0},
      {listIndex: 2, lineNumber: 3, y: 30, lineNumberToShow: 0},
    ];

    const page = new TypesetterPage(400, 500, [mainTextList]);
    page.addMetadata(MetadataKey.MDK_MainTextLineData, {
      mainTextListIndex: 0,
      lineData,
    });

    const marginalia1 = [TextBoxFactory.simpleText('Note 1')];
    const marginalia2 = [TextBoxFactory.simpleText('Note 2')];

    page.addMetadata(MetadataKey.MDK_PageMarginalia, [
      {lineNumber: 1, marginalSubEntries: [marginalia1]},
      {lineNumber: 3, marginalSubEntries: [marginalia2]},
    ]);

    const processor = new AddMarginalia({
      textBoxMeasurer: measurer as any,
      xPosition: 300,
      align: 'left',
    });

    await processor.process(page);

    expect(page.getItems()).toHaveLength(2);
    const marginaliaList = page.getItems()[1] as ItemList;
    expect(marginaliaList.getMetadata(MetadataKey.ListType)).toBe(ListType.MarginaliaList);
    expect(marginaliaList.getShiftX()).toBe(300);
    expect(marginaliaList.getShiftY()).toBe(50);

    const items = marginaliaList.getList();
    expect(items).toHaveLength(3);
    expect(items[0]).toBeInstanceOf(ItemList);
    expect(items[1]).toBeInstanceOf(Glue);
    expect((items[1] as Glue).getHeight()).toBe(20);
    expect(items[2]).toBeInstanceOf(ItemList);

    const entry1 = items[0] as ItemList;
    expect(entry1.getShiftY()).toBe(5); // 15 - 10
    expect(entry1.getText()).toBe('Note 1');

    const entry2 = items[2] as ItemList;
    expect(entry2.getShiftY()).toBe(5);
    expect(entry2.getText()).toBe('Note 2');
  });

  it('handles right alignment by shifting entry list', async () => {
    const mainTextList = createMainTextList([20], 0);
    const page = new TypesetterPage(400, 500, [mainTextList]);
    page.addMetadata(MetadataKey.MDK_MainTextLineData, {
      mainTextListIndex: 0,
      lineData: [{listIndex: 0, lineNumber: 1, y: 0, lineNumberToShow: 0}],
    });
    page.addMetadata(MetadataKey.MDK_PageMarginalia, [
      {lineNumber: 1, marginalSubEntries: [[TextBoxFactory.simpleText('Longer Note')]]},
    ]);

    const processor = new AddMarginalia({
      textBoxMeasurer: measurer as any,
      align: 'right',
    });

    await processor.process(page);

    const marginaliaList = page.getItems()[1] as ItemList;
    const entry = marginaliaList.getList()[0] as ItemList;

    // 'Longer Note' length is 11. Width = 110.
    expect(entry.getShiftX()).toBe(-110);
  });

  it('warns and returns if main text metadata is missing', async () => {
    const page = new TypesetterPage(400, 500);
    page.addMetadata(MetadataKey.MDK_PageMarginalia, [{lineNumber: 1, marginalSubEntries: [[]]}]);
    
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const processor = new AddMarginalia({textBoxMeasurer: measurer as any});

    await processor.process(page);

    expect(warnSpy).toHaveBeenCalledWith('No main text line data available, marginalia not added');
    expect(page.getItems()).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('returns unchanged if no marginalia metadata', async () => {
    const page = new TypesetterPage(400, 500);
    const processor = new AddMarginalia({textBoxMeasurer: measurer as any});

    await processor.process(page);

    expect(page.getItems()).toHaveLength(0);
  });

  it('handles multiple sub-entries with glue between them', async () => {
    const mainTextList = createMainTextList([20], 0);
    const page = new TypesetterPage(400, 500, [mainTextList]);
    page.addMetadata(MetadataKey.MDK_MainTextLineData, {
      mainTextListIndex: 0,
      lineData: [{listIndex: 0, lineNumber: 1, y: 0, lineNumberToShow: 0}],
    });

    const sub1 = [TextBoxFactory.simpleText('A')];
    const sub2 = [TextBoxFactory.simpleText('B')];

    page.addMetadata(MetadataKey.MDK_PageMarginalia, [
      {lineNumber: 1, marginalSubEntries: [sub1, sub2]},
    ]);

    const processor = new AddMarginalia({
      textBoxMeasurer: measurer as any,
      align: 'left',
    });

    await processor.process(page);

    const marginaliaList = page.getItems()[1] as ItemList;
    const entry = marginaliaList.getList()[0] as ItemList;

    // Entry should have: TextBox('A'), Glue(5), TextBox('B')
    const entryItems = entry.getList();
    expect(entryItems).toHaveLength(3);
    expect(entryItems[0]).toBeInstanceOf(TextBox);
    expect(entryItems[1]).toBeInstanceOf(Glue);
    expect((entryItems[1] as Glue).getWidth()).toBe(5);
    expect(entryItems[2]).toBeInstanceOf(TextBox);
    expect(entry.getText()).toBe('A B');
  });
});
