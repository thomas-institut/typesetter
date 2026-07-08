import { describe, test, expect } from 'vitest';
import { BidiOrderInfoArray } from '@/Bidi/BidiOrderInfoArray';
import { BidiOrderInfo } from '@/Bidi/BidiOrderInfo';
import { LevelInfo } from '@/Bidi/LevelInfo';

describe('BidiOrderInfoArray', () => {
  describe('isSingleDirection', () => {
    test('returns false for empty array', () => {
      expect(BidiOrderInfoArray.isSingleDirection([])).toBe(false);
    });

    test('returns true for array with one item', () => {
      const items: BidiOrderInfo[] = [
        { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 }
      ];
      expect(BidiOrderInfoArray.isSingleDirection(items)).toBe(true);
    });

    test('returns true for array with all items having same direction', () => {
      const items: BidiOrderInfo[] = [
        { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
        { inputIndex: 1, displayOrder: 1, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 }
      ];
      expect(BidiOrderInfoArray.isSingleDirection(items)).toBe(true);
    });

    test('returns false for array with items having different directions', () => {
      const items: BidiOrderInfo[] = [
        { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
        { inputIndex: 1, displayOrder: 1, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 }
      ];
      expect(BidiOrderInfoArray.isSingleDirection(items)).toBe(false);
    });
  });

  describe('getLevelInfoFromBidiOrderInfoArray', () => {
    test('returns empty array for empty input', () => {
      expect(BidiOrderInfoArray.getLevelInfoFromBidiOrderInfoArray([])).toEqual([]);
    });

    test('returns correct LevelInfo for single level', () => {
      const items: BidiOrderInfo[] = [
        { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
        { inputIndex: 1, displayOrder: 1, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 }
      ];
      const result = BidiOrderInfoArray.getLevelInfoFromBidiOrderInfoArray(items);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        level: 0,
        start: 0,
        end: 1,
        textDirection: 'ltr'
      });
    });

    test('returns correct LevelInfo for multiple levels', () => {
      const items: BidiOrderInfo[] = [
        { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
        { inputIndex: 1, displayOrder: 2, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 },
        { inputIndex: 2, displayOrder: 1, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 },
        { inputIndex: 3, displayOrder: 3, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 }
      ];
      const result = BidiOrderInfoArray.getLevelInfoFromBidiOrderInfoArray(items);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ level: 0, start: 0, end: 0, textDirection: 'ltr' });
      expect(result[1]).toEqual({ level: 1, start: 1, end: 2, textDirection: 'rtl' });
      expect(result[2]).toEqual({ level: 0, start: 3, end: 3, textDirection: 'ltr' });
      // Wait, let's re-read the implementation of getLevelInfoFromBidiOrderInfoArray
    });
  });

  describe('detectDefaultTextDirection', () => {
    test('returns empty string for empty array', () => {
      expect(BidiOrderInfoArray.detectDefaultTextDirection([])).toBe('');
    });

    test('returns item direction for single item', () => {
      const items: BidiOrderInfo[] = [
        { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 }
      ];
      expect(BidiOrderInfoArray.detectDefaultTextDirection(items)).toBe('rtl');
    });

    test('detects LTR as default when LTR level has increasing display order', () => {
        const items: BidiOrderInfo[] = [
          { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
          { inputIndex: 1, displayOrder: 1, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 }
        ];
        expect(BidiOrderInfoArray.detectDefaultTextDirection(items)).toBe('ltr');
    });

    test('detects RTL as default when LTR level has decreasing display order', () => {
        // if (boiArray[startItem].displayOrder < boiArray[endItem].displayOrder) return textDirection;
        // else return textDirection === 'ltr' ? 'rtl' : 'ltr';
        const items: BidiOrderInfo[] = [
          { inputIndex: 0, displayOrder: 1, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
          { inputIndex: 1, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 }
        ];
        expect(BidiOrderInfoArray.detectDefaultTextDirection(items)).toBe('rtl');
    });

    test('detects RTL as default when RTL level has increasing display order', () => {
        const items: BidiOrderInfo[] = [
          { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 },
          { inputIndex: 1, displayOrder: 1, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 }
        ];
        expect(BidiOrderInfoArray.detectDefaultTextDirection(items)).toBe('rtl');
    });

    test('detects LTR as default when RTL level has decreasing display order', () => {
        const items: BidiOrderInfo[] = [
          { inputIndex: 0, displayOrder: 1, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 },
          { inputIndex: 1, displayOrder: 0, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 }
        ];
        expect(BidiOrderInfoArray.detectDefaultTextDirection(items)).toBe('ltr');
    });
  });

  describe('detectDefaultTextDirectionFromLevelInfoArray', () => {
    test('returns empty string for empty input', () => {
        expect(BidiOrderInfoArray.detectDefaultTextDirectionFromLevelInfoArray([], [])).toBe('');
    });

    test('defaults to first item direction if all levels have 1 item', () => {
        const levelInfo: LevelInfo[] = [
            { level: 0, start: 0, end: 0, textDirection: 'ltr' },
            { level: 1, start: 1, end: 1, textDirection: 'rtl' }
        ];
        const items: BidiOrderInfo[] = [
            { inputIndex: 0, displayOrder: 0, intrinsicTextDirection: 'ltr', textDirection: 'ltr', embeddingLevel: 0 },
            { inputIndex: 1, displayOrder: 1, intrinsicTextDirection: 'rtl', textDirection: 'rtl', embeddingLevel: 1 }
        ];
        expect(BidiOrderInfoArray.detectDefaultTextDirectionFromLevelInfoArray(levelInfo, items)).toBe('ltr');
    });
  });
});
