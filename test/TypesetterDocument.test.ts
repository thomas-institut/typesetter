import {describe, expect, it} from "vitest";
import {TypesetterDocument, TypesetterDocumentClass} from "@/TypesetterDocument";
import {TypesetterPage} from "@/TypesetterPage";

describe('TypesetterDocument', () => {
  describe('getExportObject', () => {
    it('returns an object with TypesetterDocument class and pages', () => {
      const doc = new TypesetterDocument();
      const page = new TypesetterPage(800, 600);
      doc.setPages([page]);
      doc.setDimensionsFromPages();
      
      const exported = doc.getExportObject();
      
      expect(exported.class).toBe(TypesetterDocumentClass);
      expect(exported.width).toBe(800);
      expect(exported.height).toBe(600);
      expect(exported.pages).toHaveLength(1);
      expect(exported.pages[0].class).toBe('TypesetterPage');
    });
  });

  describe('setFromObject', () => {
    it('sets properties and pages from object', () => {
      const doc = new TypesetterDocument();
      doc.setFromObject({
        width: 1000,
        height: 1200,
        pages: [
          {class: 'TypesetterPage', width: 1000, height: 1200, items: []}
        ]
      }, false);
      
      expect(doc.getPageCount()).toBe(1);
      expect(doc.getPage(0)).toBeInstanceOf(TypesetterPage);
      expect(doc.getPage(0).getWidth()).toBe(1000);
    });
  });
});
