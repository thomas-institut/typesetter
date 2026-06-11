import {describe, expect, it} from "vitest";
import {BasicTypesetter} from "@/BasicTypesetter";
import {ItemList} from "@/ItemList";
import {TextBox} from "@/TextBox";
import {TextBoxFactory} from "@/TextBoxFactory";
import {TextBoxMeasurer} from "@/TextBoxMeasurer/TextBoxMeasurer";
import * as MetadataKey from "@/MetadataKey";
import {HorizontalItemDirection, VerticalItemDirection} from "@/TypesetterItemDirection";

describe('BasicTypesetter Syllable Metadata', () => {
  it('should add occurrence metadata to the first syllable when a text box is split', async () => {
    const measurer = new TextBoxMeasurer();
    const typesetter = new BasicTypesetter({
      pageWidth: 200, // Wide enough to hold some syllables but not the whole word
      pageHeight: 500,
      marginLeft: 0,
      marginRight: 0,
      textBoxMeasurer: measurer,
      hyphenationLanguages: ['custom'],
      hyphenationManualEntries: ['so-me-str-ing'],
      showPageNumbers: false,
      showLineNumbers: false,
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
});
