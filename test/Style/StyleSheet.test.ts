import {describe, expect, it, vi} from 'vitest';
import {Glue} from '@/Glue';
import {StyleSheet, StyleSheetDefinition} from '@/Style/StyleSheet';
import {TextBox} from '@/TextBox';

const sampleStyleSheetDef: StyleSheetDefinition = {
  _metaData: {
    name: 'Test StyleSheet',
    description: 'StyleSheet used for unit tests',
  },
  fontConversions: [
    {
      from: {fontFamily: 'FreeSerif'},
      to: {fontFamily: 'OtherSerif'},
    },
  ],
  specialStrings: [
    {
      string: '§',
      fontFamily: 'SpecialGlyphFont',
    },
  ],
  default: {
    strings: {
      chapterTitle: 'Chapter',
    },
    text: {
      fontFamily: 'MainFont',
      fontSize: '10px',
      fontStyle: '',
      fontWeight: '',
      shiftY: '0',
    },
    paragraph: {
      lineSkip: '1em',
      indent: '0',
      align: 'left',
      keepWithNext: false,
    },
    glue: {
      width: '1em',
      stretch: '2em',
      shrink: '0.5em',
    },
  },
  emphasis: {
    parent: 'default',
    text: {
      fontStyle: 'italic',
      fontSize: '2em',
      shiftY: '0.5em',
    },
    paragraph: {
      align: 'right',
      keepWithNext: true,
      indent: '1em',
      lineSkip: '0.5em',
      spaceBefore: '0.25em',
    },
    glue: {
      width: '1em',
      stretch: '1em',
      shrink: '0.5em',
    },
  },
  greekText: {
    text: {
      fontFamily: 'MainFont',
    },
  },
  marginalia: {
    text: {
      fontFamily: 'MarginaliaFont',
    },
  },
};

describe('StyleSheet', () => {
  it('returns expected values for retrieval APIs', () => {
    const styleSheet = new StyleSheet(sampleStyleSheetDef);

    expect(styleSheet.getStrings()).toEqual({chapterTitle: 'Chapter'});
    expect(styleSheet.getStyleDefinitions()).toBe(sampleStyleSheetDef);
    expect(styleSheet.styleExists('default')).toBe(true);
    expect(styleSheet.styleExists('missing')).toBe(false);
    expect(styleSheet.getStyleDef('default')).toBe(sampleStyleSheetDef.default);
    expect(styleSheet.getFontConversionDefinitions()).toEqual(sampleStyleSheetDef.fontConversions);
    expect(styleSheet.getFontFamilies()).toEqual([
      'FreeSerif',
      'OtherSerif',
      'SpecialGlyphFont',
      'MainFont',
      'MarginaliaFont',
    ]);
  });

  it('returns empty objects and warns for unknown styles', () => {
    const styleSheet = new StyleSheet(sampleStyleSheetDef);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(styleSheet.getStrings('missing')).toEqual({});
    expect(styleSheet.getStyleDef('missing')).toEqual({});
    expect(warnSpy).toHaveBeenCalledWith("Style 'missing' does not exist");

    warnSpy.mockRestore();
  });

  it('merges style updates and adds new styles', () => {
    const styleSheet = new StyleSheet(sampleStyleSheetDef);

    styleSheet.merge({
      default: {
        text: {
          fontWeight: 'bold',
        },
        glue: {
          stretch: '3em',
        },
      },
      addedStyle: {
        parent: 'default',
        text: {
          fontStyle: 'oblique',
        },
      },
    });

    const defaultStyle = styleSheet.getStyleDef('default');
    expect(defaultStyle.text).toEqual({
      fontFamily: 'MainFont',
      fontSize: '10px',
      fontStyle: '',
      fontWeight: 'bold',
      shiftY: '0',
    });
    expect(defaultStyle.glue).toEqual({
      width: '1em',
      stretch: '3em',
      shrink: '0.5em',
    });

    expect(styleSheet.styleExists('addedStyle')).toBe(true);
    expect(styleSheet.getStyleDef('addedStyle')).toEqual({
      parent: 'default',
      text: {
        fontStyle: 'oblique',
      },
    });
  });

  it('applies style ancestry to text boxes and handles fallback + special strings', async () => {
    const styleSheet = new StyleSheet(sampleStyleSheetDef);

    const emphasisText = new TextBox().setText('Styled');
    await styleSheet.apply(emphasisText, 'emphasis');
    expect(emphasisText.getFontFamily()).toBe('MainFont');
    expect(emphasisText.getFontStyle()).toBe('italic');
    expect(emphasisText.getFontSize()).toBe(20);
    expect(emphasisText.getShiftY()).toBe(10);

    const fallbackText = new TextBox().setText('Fallback');
    await styleSheet.apply(fallbackText, 'missingStyle');
    expect(fallbackText.getFontFamily()).toBe('MainFont');
    expect(fallbackText.getFontSize()).toBe(10);

    const specialStringText = new TextBox().setText('§');
    await styleSheet.apply(specialStringText, 'default');
    expect(specialStringText.getFontFamily()).toBe('SpecialGlyphFont');
  });

  it('applies styles to glue using current base text size', async () => {
    const styleSheet = new StyleSheet(sampleStyleSheetDef);
    const glue = new Glue();

    await styleSheet.apply(glue, 'emphasis');

    expect(glue.getWidth()).toBe(20);
    expect(glue.getStretch()).toBe(20);
    expect(glue.getShrink()).toBe(10);
  });

  it('returns composed paragraph styles with converted dimensions', async () => {
    const styleSheet = new StyleSheet(sampleStyleSheetDef);

    const paragraphStyle = await styleSheet.getParagraphStyle('emphasis');
    expect(paragraphStyle).toEqual({
      lineSkip: 10,
      indent: 20,
      align: 'right',
      keepWithNext: true,
      spaceBefore: 5,
    });

    const fallbackParagraphStyle = await styleSheet.getParagraphStyle('missingStyle');
    expect(fallbackParagraphStyle).toEqual({
      lineSkip: 10,
      indent: 0,
      align: 'left',
      keepWithNext: false,
    });
  });
});
