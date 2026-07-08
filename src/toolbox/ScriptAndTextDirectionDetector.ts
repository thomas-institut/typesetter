import {isWhiteSpace} from './Util.js';


/**
 * A list of characters that are considered neutral characters when it comes to determining the script of a string.
 */
const neutralCharacters = [
  '\x5b', // left square bracket
  '\x5d', // right square bracket
  '(', // left parenthesis
  ')', // right parenthesis
  '{', // left curly brace
  '}', // right curly brace
  '«', // left guillemet
  '»', // right guillemet
  '.', // period
  ',', // comma
  ';', // semicolon
  '\'', // apostrophe
  ':', // colon
  '-', // hyphen-minus
  '"', // quotation mark
  '–', // en dash
  '—', // em dash
  '“', // left double quotation mark
  '”', // right double quotation mark
  '‘', // left single quotation mark
  '’', // right single quotation mark
];

const escapeRegExpForCharacterClass = (character: string): string => character.replace(/[\\\]-]/g, '\\$&');
const neutralCharactersPattern = `[${neutralCharacters.map(escapeRegExpForCharacterClass).join('')}]+`;

// Based on http://www.unicode.org/Public/UNIDATA/extracted/DerivedBidiClass.txt
// const ltrRegex = /[\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1]/gi

const regexes: Record<Script, RegExp> = {
  // eslint-disable-next-line no-control-regex
  'la': /[\u0000-\u007F]/gi,
  'el': /[\u0370-\u03ff\u1f00-\u1fff]/gi,
  // 'zh': /[\u3000\u3400-\u4DBF\u4E00-\u9FFF]/gi,
  // 'hi': /[\u0900-\u097F]/gi,
  'ar': /[\u0600-\u06ff]/gi,
  // 'bn': /[\u0995-\u09B9\u09CE\u09DC-\u09DF\u0985-\u0994\u09BE-\u09CC\u09D7\u09BC]/gi,
  'he': /[\u0590-\u05FF]/gi,
};

type DetectedTextDirection = 'ltr' | 'rtl' | 'en' | '';
export type Script = 'la' | 'el' | 'ar' | 'he';

export class ScriptAndTextDirectionDetector {
  private readonly defaultScript: string;


  constructor(defaultScript = 'la') {
    this.defaultScript = defaultScript;
  }

  /**
   * Detects the intrinsic text direction of the given string
   * If the string is direction-neutral, e.g., punctuation or latin numbers,
   * returns '', otherwise  returns 'rtl', 'ltr' or 'en'
   * @param word
   */
  detectTextDirection(word: string): DetectedTextDirection {

    // 1. Is it whitespace?
    if (isWhiteSpace(word)) {
      return '';
    }
    // 2. Is it all (common) neutral characters?
    const neutralCharactersOnlyRegex = new RegExp(`^${neutralCharactersPattern}$`, 'u');
    if (neutralCharactersOnlyRegex.test(word)) {
      return '';
    }

    // 2. Is it a numeric string possibly surrounded by brackets or other neutrals?
    const leadingNeutralCharactersRegex = new RegExp(`^${neutralCharactersPattern}`, 'u');
    const trailingNeutralCharactersRegex = new RegExp(`${neutralCharactersPattern}$`, 'u');


    const leadingNeutralCharactersMatch = word.match(leadingNeutralCharactersRegex);
    const firstNonStartingNeutral = leadingNeutralCharactersMatch ? leadingNeutralCharactersMatch[0].length : 0;
    if (firstNonStartingNeutral >= word.length) {
      // this should not happen because starting neutrals are a subset of neutral characters
      console.warn(`Neutral string found while testing for a numeric one!`);
      // but it's still a neutral, so it's not an error
      return '';
    }

    const wordWithoutTrailingNeutrals = word.replace(trailingNeutralCharactersRegex, '');
    if (wordWithoutTrailingNeutrals.length === 0) {
      // again, this should not happen
      console.warn(`Neutral string found while testing for a numeric one!`);
      // but it's still a neutral, so it's not an error
      return '';
    }
    const stringToTest = wordWithoutTrailingNeutrals.substring(firstNonStartingNeutral);
    const numericPrefixRegex = /^[0-9]/;
    if (numericPrefixRegex.test(stringToTest)) {
      return 'en';
    }

    // 3. Is it mostly Arabic or Hebrew?
    const lang = this.detectMajorityScript(stringToTest);
    if (lang === 'ar' || lang === 'he') {
      return 'rtl';
    }

    // 4. It should be LTR then
    return 'ltr';
  }

  /**
   * Returns the script of the given string, or null if it's neutral or mixed.
   *
   * A neutral string consists only of punctuation and/or Latin script numbers.
   *
   * This function only returns a script if all the characters in the string are either neutral or part of the script,
   * otherwise it returns null.
   *
   * @param text
   * @param ignorePunctuation
   */
  detectScript(text: string, ignorePunctuation = true): Script | null {
    const neutralsRegex = new RegExp(`${neutralCharactersPattern}`, 'gi');
    const latinScriptNumberRegex = /[0-9]/gi;

    const textWithoutNeutrals = text.replace(neutralsRegex, '').replace(latinScriptNumberRegex, '').replace(/\s/g, '');
    if (textWithoutNeutrals.length === 0) {
      return null;
    }

    for (const [lang, regex] of Object.entries(regexes)) {
      const textToTest = ignorePunctuation ? textWithoutNeutrals : text;
      const matches = textToTest.match(regex) || [];
      if (matches.length === textToTest.length) {
        return lang as Script;
      }
      if (matches.length > 0) {
        // some characters are not part of the script, so this is a mixed string
        return null;
      }
    }
    // no matches, so it should be latin script
    return 'la';
  }

  /**
   * Tries to detect the language of the given string by analyzing its characters
   *
   * The string is considered to be of a given language  if the majority of its characters are in the language's
   * character range
   *
   * @param {string}text
   * @return {string}
   */
  detectMajorityScript(text: string): string {
    // strip neutrals and Latin script numbers, which are neutral characters when it comes to script detection
    const neutralsRegex = new RegExp(`${neutralCharactersPattern}`, 'gi');
    const latinScriptNumberRegex = /[0-9]/gi;
    const textWithoutNeutrals = text.replace(neutralsRegex, '').replace(latinScriptNumberRegex, '').replace(/\s/g, '');
    if (textWithoutNeutrals.length === 0) {
      // only neutral characters, so return default language
      return this.defaultScript;
    }

    const scores: Record<string, number> = {};

    for (const [lang, regex] of Object.entries(regexes)) {
      // detect occurrences of lang in a word
      const matches = textWithoutNeutrals.match(regex) || [];
      const numMatches = matches.length;


      const score = numMatches / text.length;

      if (score) {
        // high-percentage, return result
        if (score > 0.85) {
          return lang;
        }
        scores[lang] = score;
      }
    }

    // not detected
    if (Object.keys(scores).length === 0)
      return this.defaultScript;

    // pick lang with the highest percentage
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }
}
