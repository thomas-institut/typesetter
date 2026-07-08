import {describe, expect, it} from 'vitest';
import {ScriptAndTextDirectionDetector} from '@/toolbox/ScriptAndTextDirectionDetector';

describe('ScriptAndTextDirectionDetector', () => {
  const detector = new ScriptAndTextDirectionDetector();

  describe('detectTextDirection', () => {
    it('should return empty string for whitespace', () => {
      expect(detector.detectTextDirection(' ')).toBe('');
      expect(detector.detectTextDirection('\t')).toBe('');
      expect(detector.detectTextDirection('\n')).toBe('');
    });

    it('should return empty string for neutral characters', () => {
      expect(detector.detectTextDirection('.')).toBe('');
      expect(detector.detectTextDirection(',')).toBe('');
      expect(detector.detectTextDirection(';')).toBe('');
      expect(detector.detectTextDirection(':')).toBe('');
      expect(detector.detectTextDirection('(')).toBe('');
      expect(detector.detectTextDirection(')')).toBe('');
      expect(detector.detectTextDirection('[')).toBe('');
      expect(detector.detectTextDirection(']')).toBe('');
      expect(detector.detectTextDirection('{')).toBe('');
      expect(detector.detectTextDirection('}')).toBe('');
      expect(detector.detectTextDirection('«')).toBe('');
      expect(detector.detectTextDirection('»')).toBe('');
      expect(detector.detectTextDirection('"')).toBe('');
      expect(detector.detectTextDirection('‘')).toBe('');
      expect(detector.detectTextDirection('’')).toBe('');
      expect(detector.detectTextDirection('“')).toBe('');
      expect(detector.detectTextDirection('”')).toBe('');
      expect(detector.detectTextDirection('...')).toBe('');
    });

    it('should return "en" for numeric strings', () => {
      expect(detector.detectTextDirection('123')).toBe('en');
      expect(detector.detectTextDirection('(123)')).toBe('en');
      expect(detector.detectTextDirection('[456]')).toBe('en');
      expect(detector.detectTextDirection('«789»')).toBe('en');
      expect(detector.detectTextDirection('123.')).toBe('en');
    });

    it('should handle Arabic digits as "rtl" (since they are not in [0-9])', () => {
      // Arabic-Indic digits: ١٢٣
      expect(detector.detectTextDirection('١٢٣')).toBe('rtl');
    });

    it('should return "rtl" for Arabic and Hebrew', () => {
      expect(detector.detectTextDirection('العربية')).toBe('rtl'); // Arabic
      expect(detector.detectTextDirection('עברית')).toBe('rtl'); // Hebrew
    });

    it('should return "ltr" for Latin and other scripts', () => {
      expect(detector.detectTextDirection('Hello')).toBe('ltr');
      expect(detector.detectTextDirection('Ελληνικά')).toBe('ltr'); // Greek
    });

    it('should return "ltr" for mixed Latin/Arabic where Latin predominates', () => {
      expect(detector.detectTextDirection('Hello ابج')).toBe('ltr');
    });

    it('should return "rtl" for mixed Latin/Arabic where Arabic predominates', () => {
      expect(detector.detectTextDirection('العربية abc')).toBe('rtl');
    });
  });

  describe('detectScript', () => {
    it('should return null for only punctuation and numbers (0-9)', () => {
      expect(detector.detectScript('123')).toBe(null);
      expect(detector.detectScript('123.')).toBe(null);
      expect(detector.detectScript('...')).toBe(null);
      expect(detector.detectScript('(123)')).toBe(null);
      expect(detector.detectScript('1. 2, 3')).toBe(null);
    });

    it('should detect Latin script', () => {
      expect(detector.detectScript('abc')).toBe('la');
    });

    it('should detect Greek script', () => {
      expect(detector.detectScript('αβγ')).toBe('el');
    });

    it('should detect Arabic script', () => {
      expect(detector.detectScript('ابج')).toBe('ar');
    });

    it('should detect Hebrew script', () => {
      expect(detector.detectScript('אבג')).toBe('he');
    });

    it('should detect scripts in mixed strings when ignorePunctuation is true', () => {
      expect(detector.detectScript('abc 123')).toBe('la');
      expect(detector.detectScript('ابج 123')).toBe('ar');
      expect(detector.detectScript('αβγ 456')).toBe('el');
    });

    it('should ignore punctuation when specified', () => {
      expect(detector.detectScript('abc.', true)).toBe('la');
      expect(detector.detectScript('(αβγ)', true)).toBe('el');
    });

    it('should not ignore punctuation when specified', () => {
      // If ignorePunctuation is false, numMatches will be 3 for 'abc.', stringLength is 4.
      // So it should fall back to 'la' eventually, but it won't match 'la' if it's strictly numMatches === stringLength
      // Wait, 'la' regex is [\u0000-\u007F], which includes '.'
      expect(detector.detectScript('abc.', false)).toBe('la');

      // For Greek 'αβγ.', regex for 'el' doesn't include '.'
      // So it should return null, since it is mixed
      expect(detector.detectScript('αβγ.', false)).toBe(null);
    });
  });

  describe('detectMajorityScript', () => {
    it('should detect majority script based on character range', () => {
      expect(detector.detectMajorityScript('Hello')).toBe('la');
      expect(detector.detectMajorityScript('العربية')).toBe('ar');
      expect(detector.detectMajorityScript('עברית')).toBe('he');
      expect(detector.detectMajorityScript('Ελληνικά')).toBe('el');
    });

    it('should correctly handle Hebrew strings with neutral characters', () => {
      const cases = ['ב”הסתעפות“', 'ב’הסתעפות‘', 'ב:ג', '[הוורידים]'];
      for (const text of cases) {
        expect(detector.detectMajorityScript(text), `Testing '${text}'`).toBe('he');
        expect(detector.detectScript(text), `Testing '${text}'`).toBe('he');
        expect(detector.detectTextDirection(text), `Testing '${text}'`).toBe('rtl');
      }
    });

    it('should correctly handle Hebrew strings with numbers', () => {
      const cases = ['994ב32', '994ב', ' 994ב32–995א14'];
      for (const text of cases) {
        expect(detector.detectMajorityScript(text), `Testing '${text}'`).toBe('he');
        expect(detector.detectScript(text), `Testing '${text}'`).toBe('he');
        expect(detector.detectTextDirection(text), `Testing '${text}'`).toBe('en');
      }
    });

    it('should use default script when no match is found', () => {
      const arDetector = new ScriptAndTextDirectionDetector('ar');
      // If we give it something that doesn't match any regex, it should return defaultLang
      // But 'la' regex [\u0000-\u007F] matches almost everything in basic ASCII.
      // Maybe some emojis? Emojis are outside that range.
      expect(arDetector.detectMajorityScript('😊')).toBe('ar');
    });

    it('should handle mixed content by picking the majority', () => {
      // Majority Latin
      expect(detector.detectMajorityScript('Hello ابج')).toBe('la');
      // Majority Arabic
      expect(detector.detectMajorityScript('العربية abc')).toBe('ar');
    });

    it('should handle default language preference', () => {
      const arDetector = new ScriptAndTextDirectionDetector('ar');
      // If it's a tie or close, default language might win due to adjusted matches
      // "punctuationMatches.length + latinScriptNumberMatches.length" are added to default lang matches
      expect(arDetector.detectMajorityScript('12345')).toBe('ar');
    });
  });
});
