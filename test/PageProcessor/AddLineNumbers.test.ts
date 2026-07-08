import {describe, expect, it, vi} from 'vitest';
import {AddLineNumbers} from '@/PageProcessor/AddLineNumbers';
import {ItemList} from '@/ItemList';
import {TypesetterPage} from '@/TypesetterPage';
import {HorizontalItemDirection, VerticalItemDirection} from '@/TypesetterItemDirection';
import * as MetadataKey from '@/MetadataKey';
import * as ListType from '@/ListType';
import {LineNumberData} from '@/MainTextLineData';
import {TextBox} from '@/TextBox';
import {Glue} from '@/Glue';

vi.mock('@/Typesetter', () => {
  return {
    Typesetter: {
      pt2px: (value: number) => value,
    },
  };
});

function createMainTextList(lineHeights: number[], shiftY = 25): ItemList {
  const mainTextList = new ItemList(VerticalItemDirection);
  mainTextList.setShiftY(shiftY);

  lineHeights.forEach((height) => {
    const line = new ItemList(HorizontalItemDirection);
    line.setHeight(height);
    mainTextList.pushItem(line);
  });

  return mainTextList;
}

function createPageWithMainText(mainTextList: ItemList, lineData: LineNumberData[], mainTextListIndex = 0): TypesetterPage {
  const page = new TypesetterPage(300, 400, [mainTextList]);
  page.addMetadata(MetadataKey.MDK_MainTextLineData, {
    mainTextListIndex,
    lineData,
  });
  return page;
}

describe('AddLineNumbers', () => {
  it('adds line numbers using filtered line data and right alignment offsets', async () => {
    const mainTextList = createMainTextList([12, 11, 14], 37);
    const lineData: LineNumberData[] = [
      {listIndex: 0, lineNumber: 6, y: 10, lineNumberToShow: 0},
      {listIndex: 1, lineNumber: 7, y: 24, lineNumberToShow: 0},
      {listIndex: 2, lineNumber: 10, y: 40, lineNumberToShow: 0},
    ];

    const measurer = {
      getBoxWidth: vi.fn(async (item: TextBox) => item.getText().length * 10),
      getBoxHeight: vi.fn(async () => 8),
    };

    const processor = new AddLineNumbers({
      textBoxMeasurer: measurer as any,
      frequency: 5,
      resetEachPage: true,
      showLineOne: true,
      xPosition: 20,
      align: 'right',
    });

    const page = createPageWithMainText(mainTextList, lineData);

    await processor.process(page);

    expect(page.getItems()).toHaveLength(2);
    const lineNumberList = page.getItems()[1];
    expect(lineNumberList).toBeInstanceOf(ItemList);

    const typedLineNumberList = lineNumberList as ItemList;
    expect(typedLineNumberList.getMetadata(MetadataKey.ListType)).toBe(ListType.LineNumbersList);
    expect(typedLineNumberList.getShiftX()).toBe(20);
    expect(typedLineNumberList.getShiftY()).toBe(37);

    const [glue1, text1, glue2, text2] = typedLineNumberList.getList();

    expect(glue1).toBeInstanceOf(Glue);
    expect(glue1.getHeight()).toBe(10);

    expect(text1).toBeInstanceOf(TextBox);
    expect((text1 as TextBox).getText()).toBe('1');
    expect(text1.getShiftX()).toBe(-10);
    expect(text1.getShiftY()).toBe(4);

    expect(glue2).toBeInstanceOf(Glue);
    expect(glue2.getHeight()).toBe(22);

    expect(text2).toBeInstanceOf(TextBox);
    expect((text2 as TextBox).getText()).toBe('5');
    expect(text2.getShiftX()).toBe(-10);
    expect(text2.getShiftY()).toBe(6);

    expect(measurer.getBoxWidth).toHaveBeenCalledTimes(2);
    expect(measurer.getBoxHeight).toHaveBeenCalledTimes(2);
  });

  it('uses Eastern Arabic numeral conversion and skips right-alignment width measurement when align is not right', async () => {
    const mainTextList = createMainTextList([10], 11);
    const lineData: LineNumberData[] = [
      {listIndex: 0, lineNumber: 2, y: 7, lineNumberToShow: 0},
    ];

    const measurer = {
      getBoxWidth: vi.fn(async () => 123),
      getBoxHeight: vi.fn(async () => 8),
    };

    const processor = new AddLineNumbers({
      textBoxMeasurer: measurer as any,
      frequency: 1,
      showLineOne: false,
      resetEachPage: false,
      numeralSystem: 'EasternArabic',
      align: 'left',
      xPosition: 99,
    });

    const page = createPageWithMainText(mainTextList, lineData);

    await processor.process(page);

    const lineNumberList = page.getItems()[1] as ItemList;
    const [glue, numberTextBox] = lineNumberList.getList();

    expect(glue).toBeInstanceOf(Glue);
    expect(glue.getHeight()).toBe(7);

    expect(numberTextBox).toBeInstanceOf(TextBox);
    expect((numberTextBox as TextBox).getText()).toBe('٢');
    expect(numberTextBox.getTextDirection()).toBe('ltr');
    expect(numberTextBox.getShiftX()).toBe(0);
    expect(numberTextBox.getShiftY()).toBe(2);

    expect(measurer.getBoxWidth).not.toHaveBeenCalled();
    expect(measurer.getBoxHeight).toHaveBeenCalledTimes(1);
  });

  it('resolves and warns when page has no main text metadata', async () => {
    const mainTextList = createMainTextList([10], 11);
    const page = new TypesetterPage(300, 400, [mainTextList]);

    const measurer = {
      getBoxWidth: vi.fn(async () => 10),
      getBoxHeight: vi.fn(async () => 8),
    };

    const processor = new AddLineNumbers({
      textBoxMeasurer: measurer as any,
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await processor.process(page);

    expect(result).toBe(page);
    expect(page.getItems()).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith('No main text line data available, line numbers not added');
    expect(measurer.getBoxWidth).not.toHaveBeenCalled();
    expect(measurer.getBoxHeight).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns page unchanged when mainTextListIndex is -1', async () => {
    const mainTextList = createMainTextList([12], 15);
    const lineData: LineNumberData[] = [
      {listIndex: 0, lineNumber: 1, y: 3, lineNumberToShow: 0},
    ];

    const measurer = {
      getBoxWidth: vi.fn(async () => 10),
      getBoxHeight: vi.fn(async () => 8),
    };

    const processor = new AddLineNumbers({
      textBoxMeasurer: measurer as any,
    });

    const page = createPageWithMainText(mainTextList, lineData, -1);
    const originalItems = page.getItems().slice();

    const result = await processor.process(page);

    expect(result).toBe(page);
    expect(page.getItems()).toStrictEqual(originalItems);
    expect(measurer.getBoxWidth).not.toHaveBeenCalled();
    expect(measurer.getBoxHeight).not.toHaveBeenCalled();
  });

  it('returns page unchanged when filtering removes all candidate lines', async () => {
    const mainTextList = createMainTextList([10, 10], 15);
    const lineData: LineNumberData[] = [
      {listIndex: 0, lineNumber: 2, y: 3, lineNumberToShow: 0},
      {listIndex: 1, lineNumber: 3, y: 16, lineNumberToShow: 0},
    ];

    const measurer = {
      getBoxWidth: vi.fn(async () => 10),
      getBoxHeight: vi.fn(async () => 8),
    };

    const processor = new AddLineNumbers({
      textBoxMeasurer: measurer as any,
      frequency: 5,
      showLineOne: false,
      resetEachPage: false,
    });

    const page = createPageWithMainText(mainTextList, lineData);

    await processor.process(page);

    expect(page.getItems()).toHaveLength(1);
    expect(measurer.getBoxWidth).not.toHaveBeenCalled();
    expect(measurer.getBoxHeight).not.toHaveBeenCalled();
  });
});
