import {describe, expect, it} from "vitest";
import {Glue, GlueClass} from "@/Glue";
import * as TypesetterItemDirection from "@/TypesetterItemDirection";

describe('Glue', () => {
  describe('getExportObject', () => {
    it('returns an object with Glue class and properties', () => {
      const glue = new Glue(TypesetterItemDirection.HorizontalItemDirection);
      glue.setWidth(10).setStretch(5).setShrink(2);
      const exported = glue.getExportObject();
      
      expect(exported.class).toBe(GlueClass);
      expect(exported.width).toBe(10);
      expect(exported.stretch).toBe(5);
      expect(exported.shrink).toBe(2);
      expect(exported.direction).toBe(TypesetterItemDirection.HorizontalItemDirection);
    });
  });

  describe('setFromObject', () => {
    it('sets properties from object', () => {
      const glue = new Glue();
      glue.setFromObject({
        width: 15,
        stretch: 8,
        shrink: 3,
        direction: TypesetterItemDirection.VerticalItemDirection
      }, false);
      
      expect(glue.getWidth()).toBe(15);
      expect(glue.getStretch()).toBe(8);
      expect(glue.getShrink()).toBe(3);
      expect(glue.getDirection()).toBe(TypesetterItemDirection.VerticalItemDirection);
    });

    it('merges properties if mergeValues is true', () => {
      const glue = new Glue();
      glue.setWidth(10).setStretch(5).setShrink(2);
      glue.setFromObject({
        stretch: 8
      }, true);
      
      expect(glue.getWidth()).toBe(10);
      expect(glue.getStretch()).toBe(8);
      expect(glue.getShrink()).toBe(2);
    });
  });
});
