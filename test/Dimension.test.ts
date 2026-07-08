import {describe, expect, it, vi} from "vitest";
import {Dimension} from "@/Dimension";

describe('Dimension', () => {
  describe('parse', () => {
    it('handles null', () => {
      expect(Dimension.parse(null)).toEqual([0, 'px']);
    });

    it('handles numbers', () => {
      expect(Dimension.parse(10)).toEqual([10, 'px']);
      expect(Dimension.parse(12.5)).toEqual([12.5, 'px']);
    });

    it('handles strings with units', () => {
      expect(Dimension.parse('10px')).toEqual([10, 'px']);
      expect(Dimension.parse('2em')).toEqual([2, 'em']);
      expect(Dimension.parse('1.5 cm')).toEqual([1.5, 'cm']);
    });

    it('handles strings without units (defaults to px)', () => {
      expect(Dimension.parse('10')).toEqual([10, 'px']);
    });

  });

  describe('getPixelValue', () => {
    it('converts em to px', () => {
      expect(Dimension.getPixelValue('2em', 16)).toBe(32);
    });

    it('converts sp to px', () => {
      expect(Dimension.getPixelValue('1sp', 16, 4)).toBe(4);
    });

    it('returns -1 for invalid units', () => {
      expect(Dimension.getPixelValue('10unknown', 16)).toBe(-1);
    });
  });

  describe('str2px', () => {
    it('converts various strings to pixels', () => {
      expect(Dimension.str2px('10px')).toBe(10);
      expect(Dimension.str2px('72pt')).toBe(96);
      expect(Dimension.str2px('1cm')).toBeCloseTo(37.795, 3);
    });
  });

  describe('str2pt', () => {
    it('converts various strings to points', () => {
      expect(Dimension.str2pt('96px')).toBe(72);
      expect(Dimension.str2pt('10pt')).toBe(10);
    });
  });

  describe('str2cm', () => {
    it('converts various strings to centimeters', () => {
      expect(Dimension.str2cm('1cm')).toBeCloseTo(1, 10);
      expect(Dimension.str2cm(37.79527559055118)).toBeCloseTo(1, 5);
    });
  });

  describe('valueUnit2px', () => {
    it('handles all supported units', () => {
      expect(Dimension.valueUnit2px(10, 'px')).toBe(10);
      expect(Dimension.valueUnit2px(72, 'pt')).toBe(96);
      expect(Dimension.valueUnit2px(72, 'pts')).toBe(96);
      expect(Dimension.valueUnit2px(1, 'cm')).toBeCloseTo(37.795, 3);
      expect(Dimension.valueUnit2px(1, 'cms')).toBeCloseTo(37.795, 3);
      expect(Dimension.valueUnit2px(10, 'mm')).toBeCloseTo(37.795, 3);
      expect(Dimension.valueUnit2px(10, 'mms')).toBeCloseTo(37.795, 3);
      expect(Dimension.valueUnit2px(2, 'em', 16)).toBe(32);
      expect(Dimension.valueUnit2px(2, 'ems', 16)).toBe(32);
      expect(Dimension.valueUnit2px(1, 'sp', 0, 4)).toBe(4);
    });

    it('returns -1 and warns for invalid units', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(Dimension.valueUnit2px(10, 'invalid')).toBe(-1);
      expect(consoleSpy).toHaveBeenCalledWith("Invalid unit 'invalid'");
      consoleSpy.mockRestore();
    });

    it('warns when spaceSize is zero for sp unit', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(Dimension.valueUnit2px(1, 'sp', 16, 0)).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith("Space size is zero when converting value to pixel dimension: 1");
      consoleSpy.mockRestore();
    });
  });

  describe('static conversion helpers', () => {
    it('cm2px and px2cm', () => {
      expect(Dimension.cm2px(1)).toBeCloseTo(37.795, 3);
      expect(Dimension.px2cm(Dimension.cm2px(1))).toBe(1);
    });

    it('pt2px and px2pt', () => {
      expect(Dimension.pt2px(72)).toBe(96);
      expect(Dimension.px2pt(96)).toBe(72);
    });
  });
});
