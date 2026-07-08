import {describe, expect, it} from "vitest";
import {TypesetterPage, TypesetterPageClass} from "@/TypesetterPage";
import {TextBox} from "@/TextBox";

describe('TypesetterPage', () => {
  describe('getExportObject', () => {
    it('returns an object with TypesetterPage class and items', () => {
      const page = new TypesetterPage(800, 600);
      const textBox = new TextBox();
      textBox.setText('Page Content');
      page.addItem(textBox);
      
      const exported = page.getExportObject();
      
      expect(exported.class).toBe(TypesetterPageClass);
      expect(exported.width).toBe(800);
      expect(exported.height).toBe(600);
      expect(exported.items).toHaveLength(1);
      expect(exported.items[0].class).toBe('TextBox');
      expect(exported.items[0].text).toBe('Page Content');
    });
  });

  describe('setFromObject', () => {
    it('sets properties and items from object', () => {
      const page = new TypesetterPage();
      page.setFromObject({
        width: 1024,
        height: 768,
        items: [
          {class: 'TextBox', text: 'New Content'}
        ]
      }, false);
      
      expect(page.getWidth()).toBe(1024);
      expect(page.getHeight()).toBe(768);
      expect(page.getItems()).toHaveLength(1);
      expect(page.getItems()[0]).toBeInstanceOf(TextBox);
      expect((page.getItems()[0] as TextBox).getText()).toBe('New Content');
    });
  });
});
