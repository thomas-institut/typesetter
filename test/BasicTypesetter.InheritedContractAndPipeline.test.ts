import {describe, expect, it, vi} from "vitest";
import {BasicTypesetter, BasicTypesetterSignature, BasicTypesetterVersion} from "@/BasicTypesetter";
import {ItemList} from "@/ItemList";
import {createItemArrayFromString} from "@/ItemArrayFromString";
import {HorizontalItemDirection, VerticalItemDirection} from "@/TypesetterItemDirection";
import {TextBoxMeasurer} from "@/TextBoxMeasurer/TextBoxMeasurer";
import {TypesetterItem} from "@/TypesetterItem";
import {Glue} from "@/Glue";
import {Penalty} from "@/Penalty";
import {TextBoxFactory} from "@/TextBoxFactory";
import * as MetadataKey from "@/MetadataKey";
import * as ListType from "@/ListType";
import * as LineType from "@/LineType";
import * as GlueType from "@/GlueType";
import {FirstFitLineBreaker} from "@/LineBreaker/FirstFitLineBreaker";

function makeTypesetter(options: Record<string, any> = {}) {
  const textBoxMeasurer = options.textBoxMeasurer ?? new TextBoxMeasurer();
  return new BasicTypesetter({
    pageWidth: 120,
    pageHeight: 120,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    showPageNumbers: false,
    showLineNumbers: false,
    lineNumbersOptions: {resetEachPage: false, textBoxMeasurer},
    textBoxMeasurer,
    ...options,
  });
}

function makeParagraph(text: string): ItemList {
  const paragraph = new ItemList(HorizontalItemDirection);
  paragraph.pushItemArray(createItemArrayFromString(text));
  return paragraph;
}

function getMainTextBlock(pageItems: TypesetterItem[]): ItemList {
  const mainTextBlock = pageItems.find((item) => {
    return item instanceof ItemList
      && item.getDirection() === VerticalItemDirection
      && item.getMetadata(MetadataKey.ListType) === ListType.MainTextBlockList;
  });
  if (!(mainTextBlock instanceof ItemList)) {
    throw new Error('Main text block not found in page items');
  }
  return mainTextBlock;
}

function getLineItems(verticalList: ItemList): ItemList[] {
  return verticalList.getList().filter((item) => {
    return item instanceof ItemList && item.getMetadata(MetadataKey.LineType) === LineType.MainTextLine;
  }) as ItemList[];
}

describe('BasicTypesetter inherited contract and pipeline', () => {
  it('A1: typesetHorizontalList rejects vertical list', async () => {
    const typesetter = makeTypesetter();
    const verticalList = new ItemList(VerticalItemDirection);

    await expect(typesetter.typesetHorizontalList(verticalList)).rejects.toThrow('typesetHorizontalList called with a vertical list');
  });

  it('A2: typesetVerticalList rejects horizontal list', async () => {
    const typesetter = makeTypesetter();
    const horizontalList = new ItemList(HorizontalItemDirection);

    await expect(typesetter.typesetVerticalList(horizontalList)).rejects.toThrow('typesetVerticalList called with a horizontal list');
  });

  it('A3: typeset rejects non-vertical main list', async () => {
    const typesetter = makeTypesetter();
    const horizontalMainList = new ItemList(HorizontalItemDirection);

    await expect(typesetter.typeset(horizontalMainList)).rejects.toThrow('Cannot typeset a non-vertical list');
  });

  it('B1: typeset happy-path one paragraph with line metadata', async () => {
    const typesetter = makeTypesetter({
      pageWidth: 160,
      pageHeight: 180,
      marginLeft: 13,
      marginTop: 17,
      marginRight: 11,
      marginBottom: 9,
    });
    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(makeParagraph('A short paragraph to typeset into one or more lines.'));

    const doc = await typesetter.typeset(mainTextList);

    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    const firstPage = doc.getPage(0);
    const mainTextBlock = getMainTextBlock(firstPage.getItems());

    expect(mainTextBlock.getShiftX()).toBe(13);
    expect(mainTextBlock.getShiftY()).toBe(17);

    const lines = getLineItems(mainTextBlock);
    expect(lines.length).toBeGreaterThan(0);

    const firstLine = lines[0];
    expect(firstLine.hasMetadata(MetadataKey.LineNumberInParagraph)).toBe(true);
    expect(firstLine.hasMetadata(MetadataKey.ParagraphLineCount)).toBe(true);
    expect(firstLine.getMetadata(MetadataKey.LineType)).toBe(LineType.MainTextLine);
  });

  it('B2: typeset handles glue + paragraph + penalty + unsupported item', async () => {
    const typesetter = makeTypesetter({pageWidth: 180, pageHeight: 140});
    const mainTextList = new ItemList(VerticalItemDirection);

    mainTextList.pushItem(new Glue(VerticalItemDirection).setHeight(8).setWidth(1));
    mainTextList.pushItem(makeParagraph('Paragraph content should still be typeset correctly.'));
    mainTextList.pushItem(new Penalty().setPenalty(30));
    mainTextList.pushItem(TextBoxFactory.simpleText('ignored standalone textbox'));

    const doc = await typesetter.typeset(mainTextList);

    expect(doc.getPageCount()).toBeGreaterThan(0);
    const firstPage = doc.getPage(0);
    const mainTextBlock = getMainTextBlock(firstPage.getItems());
    const lines = getLineItems(mainTextBlock);

    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => {
      expect(line.hasMetadata(MetadataKey.ParagraphNumber)).toBe(true);
    });
  });

  it('B3: typesetHorizontalList returns empty vertical list for empty paragraph', async () => {
    const typesetter = makeTypesetter();
    const emptyParagraph = new ItemList(HorizontalItemDirection);

    const output = await typesetter.typesetHorizontalList(emptyParagraph);

    expect(output.getDirection()).toBe(VerticalItemDirection);
    expect(output.getList().length).toBe(0);
  });

  it('B4: inter-line glue metadata is set for non-final and unset for final glue', async () => {
    const typesetter = makeTypesetter({pageWidth: 120, pageHeight: 300});
    const paragraph = makeParagraph('ignored by mocked line breaker');

    const line1 = new ItemList(HorizontalItemDirection);
    line1.pushItem(TextBoxFactory.simpleText('line1'));
    const line2 = new ItemList(HorizontalItemDirection);
    line2.pushItem(TextBoxFactory.simpleText('line2'));
    const line3 = new ItemList(HorizontalItemDirection);
    line3.pushItem(TextBoxFactory.simpleText('line3'));

    const breakIntoLinesSpy = vi.spyOn(FirstFitLineBreaker, 'breakIntoLines').mockResolvedValue([line1, line2, line3]);

    const output = await typesetter.typesetHorizontalList(paragraph);
    breakIntoLinesSpy.mockRestore();
    const glues = output.getList().filter((item) => item instanceof Glue) as Glue[];

    expect(glues.length).toBeGreaterThan(1);
    glues.slice(0, -1).forEach((glue) => {
      expect(glue.getMetadata(MetadataKey.InterLineGlueSet)).toBe(true);
    });
    expect(glues[glues.length - 1].getMetadata(MetadataKey.InterLineGlueSet)).toBe(false);
  });

  it('B5: typesetVerticalList splits pages and trims trailing glue per page', async () => {
    const typesetter = makeTypesetter({pageWidth: 120, pageHeight: 60});
    const verticalList = new ItemList(VerticalItemDirection);

    for (let i = 0; i < 8; i++) {
      const line = new ItemList(HorizontalItemDirection).setHeight(16).setWidth(90);
      verticalList.pushItem(line);
      verticalList.pushItem(new Glue(VerticalItemDirection).setHeight(4).setWidth(90));
    }

    const pageList = await typesetter.typesetVerticalList(verticalList);

    expect(pageList.getDirection()).toBe(HorizontalItemDirection);
    expect(pageList.getList().length).toBeGreaterThan(1);

    pageList.getList().forEach((page) => {
      expect(page).toBeInstanceOf(ItemList);
      const pageItems = (page as ItemList).getList();
      expect(pageItems.length).toBeGreaterThan(0);
      expect(pageItems[pageItems.length - 1]).not.toBeInstanceOf(Glue);
    });
  });

  it('B6: typeset end-to-end produces multiple pages with page numbers and document signature', async () => {
    const typesetter = makeTypesetter({
      pageWidth: 120,
      pageHeight: 70,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    });
    const mainTextList = new ItemList(VerticalItemDirection);

    for (let i = 0; i < 8; i++) {
      mainTextList.pushItem(makeParagraph(`Paragraph number ${i + 1} contains enough words to wrap and paginate.`));
    }

    const doc = await typesetter.typeset(mainTextList);

    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(doc.getMetadata('typesetter')).toBe(BasicTypesetterSignature);
    expect(doc.getMetadata('typesetterVersion')).toBe(BasicTypesetterVersion);

    doc.getPages().forEach((page, index) => {
      expect(page.getMetadata(MetadataKey.PageNumber)).toBe(index + 1);
    });
  });

  it('C1: typeset works when no apparatuses are provided', async () => {
    const preTypesetApparatuses = vi.fn(async () => true);
    const typesetter = makeTypesetter({
      pageWidth: 150,
      pageHeight: 140,
      preTypesetApparatuses,
    });
    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(makeParagraph('Main text should be typeset even when apparatuses are omitted.'));

    const doc = await typesetter.typeset(mainTextList);

    expect(doc.getPageCount()).toBeGreaterThan(0);
    expect(preTypesetApparatuses).not.toHaveBeenCalled();
  });

  it('C2: typeset appends apparatuses at end of document when configured', async () => {
    const apparatuses = [{id: 'app-1'}];
    const getApparatusListToTypeset = vi.fn(async (_mainTextVerticalList: ItemList, app: {id: string}) => {
      const list = new ItemList(HorizontalItemDirection);
      list.pushItemArray(createItemArrayFromString(`apparatus-${app.id} content`));
      return list;
    });
    const typesetter = makeTypesetter({
      pageWidth: 180,
      pageHeight: 260,
      apparatusesAtEndOfDocument: true,
      getApparatusListToTypeset,
    });
    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(makeParagraph('Main paragraph for end-of-document apparatus test.'));

    const doc = await typesetter.typeset(mainTextList, {apparatuses});

    expect(doc.getPageCount()).toBeGreaterThan(0);
    expect(getApparatusListToTypeset).toHaveBeenCalledTimes(1);
    expect(getApparatusListToTypeset).toHaveBeenCalledWith(expect.any(ItemList), apparatuses[0], 1, expect.any(Number), false);

    const hasTextToApparatusGlue = doc.getPages().some((page) => {
      const mainTextBlock = getMainTextBlock(page.getItems());
      return mainTextBlock.getList().some((item) => {
        return item instanceof Glue && item.getMetadata(MetadataKey.GlueType) === GlueType.TextToApparatusVerticalGlue;
      });
    });
    expect(hasTextToApparatusGlue).toBe(true);
  });

  it('C3: typeset places apparatuses at page foot when apparatusesAtEndOfDocument is false', async () => {
    const apparatuses = [{id: 'app-1'}];
    const getApparatusListToTypeset = vi.fn(async (_mainTextVerticalList: ItemList, app: {id: string}) => {
      const list = new ItemList(HorizontalItemDirection);
      list.pushItemArray(createItemArrayFromString(`footnote-${app.id}`));
      return list;
    });
    const typesetter = makeTypesetter({
      pageWidth: 120,
      pageHeight: 90,
      apparatusesAtEndOfDocument: false,
      getApparatusListToTypeset,
    });
    const mainTextList = new ItemList(VerticalItemDirection);
    for (let i = 0; i < 4; i++) {
      mainTextList.pushItem(makeParagraph(`Paragraph ${i + 1} has enough text to create several wrapped lines on the page.`));
    }

    const doc = await typesetter.typeset(mainTextList, {apparatuses});

    expect(doc.getPageCount()).toBeGreaterThan(0);
    expect(getApparatusListToTypeset).toHaveBeenCalled();

    const pagesWithApparatusGlue = doc.getPages().filter((page) => {
      const mainTextBlock = getMainTextBlock(page.getItems());
      return mainTextBlock.getList().some((item) => {
        return item instanceof Glue && item.getMetadata(MetadataKey.GlueType) === GlueType.TextToApparatusVerticalGlue;
      });
    });
    expect(pagesWithApparatusGlue.length).toBeGreaterThan(0);

    const pageHasMainTextAndApparatus = pagesWithApparatusGlue.some((page) => {
      const mainTextBlock = getMainTextBlock(page.getItems());
      return mainTextBlock.getList().some((item) => {
        return item instanceof ItemList && item.getMetadata(MetadataKey.LineType) === LineType.MainTextLine;
      });
    });
    expect(pageHasMainTextAndApparatus).toBe(true);
  });

  it('C4: preTypesetApparatuses hook is called once with apparatus list', async () => {
    const apparatuses = [{id: 'a1'}, {id: 'a2'}];
    const preTypesetApparatuses = vi.fn(async (_apps: {id: string}[]) => true);
    const getApparatusListToTypeset = vi.fn(async (_mainTextVerticalList: ItemList) => {
      return new ItemList(HorizontalItemDirection);
    });
    const typesetter = makeTypesetter({
      pageWidth: 150,
      pageHeight: 140,
      preTypesetApparatuses,
      getApparatusListToTypeset,
    });
    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(makeParagraph('Main text for pre-typeset apparatus hook test.'));

    await typesetter.typeset(mainTextList, {apparatuses});

    expect(preTypesetApparatuses).toHaveBeenCalledTimes(1);
    expect(preTypesetApparatuses).toHaveBeenCalledWith(apparatuses);
  });
});
