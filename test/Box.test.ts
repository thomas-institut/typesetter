import {describe, expect, it} from "vitest";
import {Box, BoxClass} from "@/Box";

describe('Box', () => {
  describe('getExportObject', () => {
    it('returns an object with Box class', () => {
      const box = new Box();
      box.setWidth(100).setHeight(50);
      const exported = box.getExportObject();
      
      expect(exported.class).toBe(BoxClass);
      expect(exported.width).toBe(100);
      expect(exported.height).toBe(50);
    });
  });

  describe('setFromObject', () => {
    it('sets properties via TypesetterItem implementation', () => {
      const box = new Box();
      box.setFromObject({
        width: 200,
        height: 100
      }, false);
      
      expect(box.getWidth()).toBe(200);
      expect(box.getHeight()).toBe(100);
    });
  });
});
