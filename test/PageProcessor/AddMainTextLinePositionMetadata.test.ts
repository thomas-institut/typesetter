import {describe, expect, it} from 'vitest';
import {AddMainTextLinePositionMetadata} from '@/PageProcessor/AddMainTextLinePositionMetadata';
import {TypesetterPage} from '@/TypesetterPage';
import {ItemList} from '@/ItemList';
import {HorizontalItemDirection, VerticalItemDirection} from '@/TypesetterItemDirection';
import * as MetadataKey from '@/MetadataKey';
import * as ListType from '@/ListType';
import * as LineType from '@/LineType';
import {Glue} from '@/Glue';

function createMainTextList(items: any[]): ItemList {
  const list = new ItemList(VerticalItemDirection);
  list.addMetadata(MetadataKey.ListType, ListType.MainTextBlockList);
  list.pushItemArray(items);
  return list;
}

function createLine(lineNumber: number, height: number, lineType: string = LineType.MainTextLine): ItemList {
  const line = new ItemList(HorizontalItemDirection);
  line.addMetadata(MetadataKey.ListType, ListType.LineList);
  line.addMetadata(MetadataKey.LineNumber, lineNumber);
  line.addMetadata(MetadataKey.LineType, lineType);
  line.setHeight(height);
  return line;
}

describe('AddMainTextLinePositionMetadata', () => {
  it('adds metadata with mainTextListIndex -1 if no main text block', async () => {
    const page = new TypesetterPage(400, 500);
    const processor = new AddMainTextLinePositionMetadata();

    await processor.process(page);

    const metadata = page.getMetadata(MetadataKey.MDK_MainTextLineData);
    expect(metadata).toEqual({mainTextListIndex: -1, lineData: {}});
  });

  it('calculates Y positions for lines in main text block', async () => {
    const line1 = createLine(1, 15);
    const glue = new Glue();
    glue.setHeight(5);
    const line2 = createLine(2, 20);

    const mainTextList = createMainTextList([line1, glue, line2]);
    const page = new TypesetterPage(400, 500, [mainTextList]);

    const processor = new AddMainTextLinePositionMetadata();
    await processor.process(page);

    const metadata = page.getMetadata(MetadataKey.MDK_MainTextLineData);
    expect(metadata.mainTextListIndex).toBe(0);
    expect(metadata.lineData).toHaveLength(2);

    // Line 1: index 0, y = 0
    expect(metadata.lineData[0]).toEqual({
      listIndex: 0,
      lineNumber: 1,
      y: 0
    });

    // Line 2: index 2 (after line1 and glue), y = 15 + 5 = 20
    expect(metadata.lineData[1]).toEqual({
      listIndex: 2,
      lineNumber: 2,
      y: 20
    });
  });

  it('respects listTypeToNumber option', async () => {
    const customListType = 'CustomMainText';
    const line1 = createLine(1, 15);
    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.addMetadata(MetadataKey.ListType, customListType);
    mainTextList.pushItem(line1);

    const page = new TypesetterPage(400, 500, [mainTextList]);

    const processor = new AddMainTextLinePositionMetadata({
      listTypeToNumber: customListType
    });
    await processor.process(page);

    const metadata = page.getMetadata(MetadataKey.MDK_MainTextLineData);
    expect(metadata.mainTextListIndex).toBe(0);
    expect(metadata.lineData[0].lineNumber).toBe(1);
  });

  it('filters by lineTypeToNumber option', async () => {
    const line1 = createLine(1, 10, LineType.MainTextLine);
    const line2 = createLine(2, 10, LineType.ApparatusLine);

    const mainTextList = createMainTextList([line1, line2]);
    const page = new TypesetterPage(400, 500, [mainTextList]);

    const processor = new AddMainTextLinePositionMetadata({
      lineTypeToNumber: LineType.MainTextLine
    });

    await processor.process(page);

    const metadata = page.getMetadata(MetadataKey.MDK_MainTextLineData);
    expect(metadata.lineData).toHaveLength(1);
    expect(metadata.lineData[0].lineNumber).toBe(1);
  });

  it('handles lines without line number', async () => {
    const line1 = createLine(1, 10);
    const line2 = new ItemList(HorizontalItemDirection);
    line2.addMetadata(MetadataKey.ListType, ListType.LineList);
    line2.addMetadata(MetadataKey.LineType, LineType.MainTextLine);
    line2.setHeight(10);
    // no LineNumber metadata

    const mainTextList = createMainTextList([line1, line2]);
    const page = new TypesetterPage(400, 500, [mainTextList]);

    const processor = new AddMainTextLinePositionMetadata();
    await processor.process(page);

    const metadata = page.getMetadata(MetadataKey.MDK_MainTextLineData);
    expect(metadata.lineData).toHaveLength(1);
    expect(metadata.lineData[0].lineNumber).toBe(1);
  });

  it('handles non-line items in the main text list', async () => {
    const line1 = createLine(1, 10);
    const otherList = new ItemList(HorizontalItemDirection);
    otherList.addMetadata(MetadataKey.ListType, 'other');
    otherList.setHeight(10);
    const line2 = createLine(2, 10);

    const mainTextList = createMainTextList([line1, otherList, line2]);
    const page = new TypesetterPage(400, 500, [mainTextList]);

    const processor = new AddMainTextLinePositionMetadata();
    await processor.process(page);

    const metadata = page.getMetadata(MetadataKey.MDK_MainTextLineData);
    expect(metadata.lineData).toHaveLength(2);
    expect(metadata.lineData[1].lineNumber).toBe(2);
    expect(metadata.lineData[1].y).toBe(20); // 10 (line1) + 10 (otherList)
  });
});
