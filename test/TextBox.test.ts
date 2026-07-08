import {describe, expect, it} from "vitest";
import {TextBox, TextBoxClass} from "@/TextBox";

describe('TextBox', () => {
  describe('getExportObject', () => {
    it('returns an object with TextBox class and properties', () => {
      const textBox = new TextBox();
      textBox.setText('Hello').setFontFamily('Arial').setFontSize(12).setFontStyle('italic').setFontWeight('bold');
      const exported = textBox.getExportObject();
      
      expect(exported.class).toBe(TextBoxClass);
      expect(exported.text).toBe('Hello');
      expect(exported.fontFamily).toBe('Arial');
      expect(exported.fontSize).toBe(12);
      expect(exported.fontStyle).toBe('italic');
      expect(exported.fontWeight).toBe('bold');
    });
  });

  describe('setFromObject', () => {
    it('sets properties from object', () => {
      const textBox = new TextBox();
      textBox.setFromObject({
        text: 'World',
        fontFamily: 'Helvetica',
        fontSize: 14,
        fontStyle: 'normal',
        fontWeight: 'normal'
      }, false);
      
      expect(textBox.getText()).toBe('World');
      expect(textBox.getFontFamily()).toBe('Helvetica');
      expect(textBox.getFontSize()).toBe(14);
      expect(textBox.getFontStyle()).toBe('normal');
      expect(textBox.getFontWeight()).toBe('normal');
    });

    it('merges properties if mergeValues is true', () => {
      const textBox = new TextBox();
      textBox.setText('Hello').setFontSize(12);
      textBox.setFromObject({
        text: 'World'
      }, true);
      
      expect(textBox.getText()).toBe('World');
      expect(textBox.getFontSize()).toBe(12);
    });
  });
});
