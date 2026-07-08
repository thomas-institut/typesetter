import {describe, expect, it, vi} from 'vitest';
import {AddPageNumbers} from '@/PageProcessor/AddPageNumbers';
import {TypesetterPage} from '@/TypesetterPage';
import * as MetadataKey from '@/MetadataKey';
import {TextBox} from '@/TextBox';

vi.mock('@/Typesetter', () => {
  return {
    Typesetter: {
      pt2px: (value: number) => value,
    },
  };
});

describe('AddPageNumbers', () => {
  const measurer = {
    getBoxWidth: vi.fn(async (item: TextBox) => item.getText().length * 10),
    getBoxHeight: vi.fn(async () => 12),
  };

  const defaultOptions = {
    fontFamily: 'serif',
    fontSize: 10,
    textBoxMeasurer: measurer as any,
    marginTop: 20,
    marginLeft: 15,
    lineWidth: 200,
  };

  it('adds a page number with center alignment', async () => {
    const page = new TypesetterPage(300, 400);
    page.addMetadata(MetadataKey.PageNumber, 5);

    const processor = new AddPageNumbers({
      ...defaultOptions,
      align: 'center',
    });

    await processor.process(page);

    expect(page.getItems()).toHaveLength(1);
    const item = page.getItems()[0] as TextBox;
    expect(item).toBeInstanceOf(TextBox);
    expect(item.getText()).toBe('5');
    expect(item.getMetadata(MetadataKey.ItemType)).toBe('PageNumber');
    expect(item.getShiftY()).toBe(20);
    expect(item.getHeight()).toBe(12);
    // Center alignment: marginLeft (15) + lineWidth/2 (100) - boxWidth/2 (5) = 110
    // boxWidth for '5' is 1 * 10 = 10.
    expect(item.getShiftX()).toBe(15 + 100 - 5);
  });

  it('adds a page number with left alignment', async () => {
    const page = new TypesetterPage(300, 400);
    page.addMetadata(MetadataKey.PageNumber, 1);

    const processor = new AddPageNumbers({
      ...defaultOptions,
      align: 'left',
    });

    await processor.process(page);

    const item = page.getItems()[0] as TextBox;
    expect(item.getShiftX()).toBe(15);
  });

  it('adds a page number with right alignment', async () => {
    const page = new TypesetterPage(300, 400);
    page.addMetadata(MetadataKey.PageNumber, 10);

    const processor = new AddPageNumbers({
      ...defaultOptions,
      align: 'right',
    });

    await processor.process(page);

    const item = page.getItems()[0] as TextBox;
    // Right alignment: marginLeft (15) + lineWidth (200) - boxWidth (20) = 195
    expect(item.getShiftX()).toBe(15 + 200 - 20);
  });

  it('uses PageFoliation metadata if available', async () => {
    const page = new TypesetterPage(300, 400);
    page.addMetadata(MetadataKey.PageNumber, 7);
    page.addMetadata(MetadataKey.PageFoliation, 'VII');

    const processor = new AddPageNumbers(defaultOptions);

    await processor.process(page);

    const item = page.getItems()[0] as TextBox;
    expect(item.getText()).toBe('VII');
  });

  it('converts to Eastern Arabic numerals', async () => {
    const page = new TypesetterPage(300, 400);
    page.addMetadata(MetadataKey.PageNumber, 12);

    const processor = new AddPageNumbers({
      ...defaultOptions,
      numeralSystem: 'EasternArabic',
    });

    await processor.process(page);

    const item = page.getItems()[0] as TextBox;
    expect(item.getText()).toBe('١٢');
  });

  it('returns page unchanged if PageNumber metadata is missing', async () => {
    const page = new TypesetterPage(300, 400);
    const processor = new AddPageNumbers(defaultOptions);

    const result = await processor.process(page);

    expect(result).toBe(page);
    expect(page.getItems()).toHaveLength(0);
  });
});
