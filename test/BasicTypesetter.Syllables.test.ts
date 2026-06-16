import {describe, expect, it, vi} from "vitest";
import {BasicTypesetter} from "@/BasicTypesetter";
import {ItemList} from "@/ItemList";
import {TextBox} from "@/TextBox";
import {TextBoxFactory} from "@/TextBoxFactory";
import {TextBoxMeasurer} from "@/TextBoxMeasurer/TextBoxMeasurer";
import {createItemArrayFromString} from "@/ItemArrayFromString";
import {FirstFitLineBreaker} from "@/LineBreaker/FirstFitLineBreaker";
import * as MetadataKey from "@/MetadataKey";
import * as LineType from "@/LineType";
import * as ListType from "@/ListType";
import {HorizontalItemDirection, VerticalItemDirection} from "@/TypesetterItemDirection";

function makeTypesetter(options: Record<string, any> = {}) {
  const measurer = options.textBoxMeasurer ?? new TextBoxMeasurer();
  return new BasicTypesetter({
    pageWidth: 200,
    pageHeight: 500,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    textBoxMeasurer: measurer,
    showPageNumbers: false,
    showLineNumbers: false,
    lineNumbersOptions: {resetEachPage: false, textBoxMeasurer: measurer},
    ...options,
  });
}

function getMainTextBlock(pageItems: any[]): ItemList {
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

function getMainTextLines(doc: any): ItemList[] {
  const lines: ItemList[] = [];
  doc.getPages().forEach((page: any) => {
    const mainTextBlock = getMainTextBlock(page.getItems());
    mainTextBlock.getList().forEach((item) => {
      if (item instanceof ItemList && item.getMetadata(MetadataKey.LineType) === LineType.MainTextLine) {
        lines.push(item);
      }
    });
  });
  return lines;
}

describe('BasicTypesetter Syllable Metadata', () => {
  it('should add occurrence metadata to the first syllable when a text box is split', async () => {
    const measurer = new TextBoxMeasurer();
    const typesetter = makeTypesetter({
      pageWidth: 200, // Wide enough to hold some syllables but not the whole word
      textBoxMeasurer: measurer,
      hyphenationLanguages: ['custom'],
      hyphenationManualEntries: ['so-me-str-ing'],
      lineNumbersOptions: { resetEachPage: false, textBoxMeasurer: measurer } // Required option
    });

    const paragraph = new ItemList(HorizontalItemDirection);
    const textBox = TextBoxFactory.simpleText('somestring', { fontSize: 12 });
    textBox.setHyphenation('custom');
    paragraph.pushItem(textBox);

    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(paragraph);

    const doc = await typesetter.typeset(mainTextList);
    
    // Find the first text box in the output
    const pages = doc.getPages();
    expect(pages.length).toBeGreaterThan(0);
    const firstPage = pages[0];
    const pageItems = firstPage.getItems();
    
    // The first item should be a Line (ItemList)
    const mainTextBlock = pageItems[0] as ItemList;
    expect(mainTextBlock).toBeInstanceOf(ItemList);
    
    const lines = mainTextBlock.getList() as ItemList[];
    const allTextBoxes: TextBox[] = [];
    lines.forEach(line => {
      line.getList().forEach(item => {
        if (item instanceof TextBox) {
          allTextBoxes.push(item);
        }
      });
    });

    expect(allTextBoxes.length).toBeGreaterThan(1);
    
    const firstTextBox = allTextBoxes[0];
    expect(firstTextBox).toBeDefined();
    
    // Check metadata for the first syllable
    expect(firstTextBox.getMetadata(MetadataKey.SplitInSyllablesItem)).toBe(true);
    expect(firstTextBox.getMetadata(MetadataKey.SyllableIndex)).toBe(0);
    
    expect(firstTextBox.hasMetadata(MetadataKey.TokenForCountingPurposes)).toBe(true);
    expect(firstTextBox.hasMetadata(MetadataKey.TokenOccurrenceInLine)).toBe(true);
    expect(firstTextBox.hasMetadata(MetadataKey.TokenTotalOccurrencesInLine)).toBe(true);

    expect(firstTextBox.getMetadata(MetadataKey.TokenForCountingPurposes)).toBe('somestring');
    expect(firstTextBox.getMetadata(MetadataKey.TokenOccurrenceInLine)).toBe(1);
    expect(firstTextBox.getMetadata(MetadataKey.TokenTotalOccurrencesInLine)).toBe(1);

    // Check that the rest of the text boxes do NOT have these metadata items
    for (let i = 1; i < allTextBoxes.length; i++) {
      const otherTextBox = allTextBoxes[i];
      expect(otherTextBox.getMetadata(MetadataKey.SplitInSyllablesItem)).toBe(true);
      expect(otherTextBox.getMetadata(MetadataKey.SyllableIndex)).toBeGreaterThan(0);

      expect(otherTextBox.hasMetadata(MetadataKey.TokenForCountingPurposes)).toBe(false);
      expect(otherTextBox.hasMetadata(MetadataKey.TokenOccurrenceInLine)).toBe(false);
      expect(otherTextBox.hasMetadata(MetadataKey.TokenTotalOccurrencesInLine)).toBe(false);
    }

  });

  it('D1: counts normalized token occurrences per line for punctuation variants', async () => {
    const typesetter = makeTypesetter({pageWidth: 220, pageHeight: 200});
    const paragraph = new ItemList(HorizontalItemDirection);
    paragraph.pushItemArray(createItemArrayFromString('ignored input'));

    const mockedLine = new ItemList(HorizontalItemDirection);
    mockedLine.pushItem(TextBoxFactory.simpleText('word,'));
    mockedLine.pushItem(TextBoxFactory.simpleText('word.'));

    const breakIntoLinesSpy = vi.spyOn(FirstFitLineBreaker, 'breakIntoLines').mockResolvedValue([mockedLine]);

    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(paragraph);

    const doc = await typesetter.typeset(mainTextList);
    breakIntoLinesSpy.mockRestore();
    const lines = getMainTextLines(doc);

    expect(lines.length).toBeGreaterThan(0);

    const firstLineTextBoxes = lines[0].getList().filter((item) => item instanceof TextBox) as TextBox[];
    expect(firstLineTextBoxes.length).toBeGreaterThanOrEqual(2);

    const firstToken = firstLineTextBoxes[0];
    const secondToken = firstLineTextBoxes[1];

    expect(firstToken.getMetadata(MetadataKey.TokenForCountingPurposes)).toBe('word');
    expect(secondToken.getMetadata(MetadataKey.TokenForCountingPurposes)).toBe('word');
    expect(firstToken.getMetadata(MetadataKey.TokenOccurrenceInLine)).toBe(1);
    expect(secondToken.getMetadata(MetadataKey.TokenOccurrenceInLine)).toBe(2);
    expect(firstToken.getMetadata(MetadataKey.TokenTotalOccurrencesInLine)).toBe(2);
    expect(secondToken.getMetadata(MetadataKey.TokenTotalOccurrencesInLine)).toBe(2);
  });

  it('D2: adds absolute and paragraph line numbering metadata across paragraphs', async () => {
    const typesetter = makeTypesetter({
      pageWidth: 145,
      pageHeight: 800,
    });

    const paragraph1 = new ItemList(HorizontalItemDirection);
    paragraph1.pushItemArray(createItemArrayFromString('First paragraph has enough words to wrap into several short lines for metadata checks.'));
    const paragraph2 = new ItemList(HorizontalItemDirection);
    paragraph2.pushItemArray(createItemArrayFromString('Second paragraph also wraps into short lines so line numbers can reset inside the paragraph.'));

    const mainTextList = new ItemList(VerticalItemDirection);
    mainTextList.pushItem(paragraph1);
    mainTextList.pushItem(paragraph2);

    const doc = await typesetter.typeset(mainTextList);
    const lines = getMainTextLines(doc);

    expect(lines.length).toBeGreaterThan(1);

    lines.forEach((line, index) => {
      expect(line.getMetadata(MetadataKey.LineNumber)).toBe(index + 1);
    });

    const linesByParagraph = new Map<number, ItemList[]>();
    lines.forEach((line) => {
      const paragraphNumber = line.getMetadata(MetadataKey.ParagraphNumber) as number;
      if (!linesByParagraph.has(paragraphNumber)) {
        linesByParagraph.set(paragraphNumber, []);
      }
      linesByParagraph.get(paragraphNumber)!.push(line);
    });

    expect(linesByParagraph.has(1)).toBe(true);
    expect(linesByParagraph.has(2)).toBe(true);

    [1, 2].forEach((paragraphNumber) => {
      const paragraphLines = linesByParagraph.get(paragraphNumber) as ItemList[];
      expect(paragraphLines.length).toBeGreaterThan(0);
      paragraphLines.forEach((line, index) => {
        expect(line.getMetadata(MetadataKey.LineNumberInParagraph)).toBe(index + 1);
      });
    });
  });
});
