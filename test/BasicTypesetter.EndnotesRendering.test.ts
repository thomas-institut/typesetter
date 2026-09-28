import {describe, expect, it} from "vitest";
import {BasicTypesetter} from "@/BasicTypesetter";
import {ItemList} from "@/ItemList";
import {createItemArrayFromString} from "@/ItemArrayFromString";
import {HorizontalItemDirection, VerticalItemDirection} from "@/TypesetterItemDirection";
import {TextBoxMeasurer} from "@/TextBoxMeasurer/TextBoxMeasurer";
import {TextBoxDataRenderer} from "@/Renderer/TextBoxDataRenderer";
import {Glue} from "@/Glue";

function makeParagraph(text: string, textDirection = ''): ItemList {
  const paragraph = new ItemList(HorizontalItemDirection);
  paragraph.pushItemArray(createItemArrayFromString(text));
  paragraph.pushItem(new Glue());
  paragraph.setTextDirection(textDirection);
  return paragraph;
}

describe('BasicTypesetter endnote rendering', () => {
  it('renders LTR endnote text in increasing x order and within page margins', async () => {
    const marginLeft = 30;
    const marginRight = 30;
    const marginTop = 20;
    const marginBottom = 20;
    const pageWidth = 320;
    const pageHeight = 200;
    const textBoxMeasurer = new TextBoxMeasurer();
    const endNoteApparatus = {id: 'endnotes'};
    const getEndNotesVerticalListToTypeset = async () => {
      const endNotes = new ItemList(VerticalItemDirection);
      endNotes.pushItem(makeParagraph('Endnote text'));
      return endNotes;
    };
    const typesetter = new BasicTypesetter({
      pageWidth,
      pageHeight,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      showPageNumbers: false,
      showLineNumbers: false,
      lineNumbersOptions: {resetEachPage: false, textBoxMeasurer},
      textBoxMeasurer,
      getEndNotesVerticalListToTypeset,
    });
    const mainText = new ItemList(VerticalItemDirection);
    mainText.pushItem(makeParagraph('Main', 'ltr'));

    const doc = await typesetter.typeset(mainText, {endNoteApparatus});
    const renderer = new TextBoxDataRenderer();
    renderer.renderDocument(doc);

    const textBoxes = renderer.getTextBoxes();
    const endNoteTextBoxes = textBoxes.filter(({text}) => text === 'Endnote' || text === 'text');

    expect(endNoteTextBoxes.map(({text}) => text)).toEqual(['Endnote', 'text']);
    for (let index = 1; index < endNoteTextBoxes.length; index++) {
      expect(endNoteTextBoxes[index].x).toBeGreaterThan(endNoteTextBoxes[index - 1].x);
    }
    textBoxes.forEach(({x, y}) => {
      expect(x).toBeGreaterThanOrEqual(marginLeft);
      expect(x).toBeLessThanOrEqual(pageWidth - marginRight);
      expect(y).toBeGreaterThanOrEqual(marginTop);
      expect(y).toBeLessThanOrEqual(pageHeight - marginBottom);
    });
  });
});