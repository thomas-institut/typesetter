/*
 *  Copyright (C) 2020 Universität zu Köln
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */
/**
 * Trims whitespace from the start and end of a string
 */
export function trimWhiteSpace(someString: string): string {
  return someString.replace(/^\s+/, '').replace(/\s+$/, '');
}

export function lTrimCharacters(someString: string, charactersToTrim: string[]) {
  let firstNonTrimmedCharacterIndex = -1;
  for (let i = 0; i < someString.length && firstNonTrimmedCharacterIndex === -1; i++) {
    if (charactersToTrim.indexOf(someString.charAt(i)) === -1) {
      firstNonTrimmedCharacterIndex = i;
    }
  }
  if (firstNonTrimmedCharacterIndex === -1) {
    return '';
  }
  return someString.substring(firstNonTrimmedCharacterIndex, someString.length);
}

export function rTrimCharacters(someString: string, charactersToTrim: string[]) {
  let lastNonTrimmedCharacterIndex = -1;
  for (let i = (someString.length - 1); i >= 0 && lastNonTrimmedCharacterIndex === -1; i--) {
    if (charactersToTrim.indexOf(someString.charAt(i)) === -1) {
      lastNonTrimmedCharacterIndex = i;
    }
  }
  if (lastNonTrimmedCharacterIndex === -1) {
    return '';
  }
  return someString.substring(0, lastNonTrimmedCharacterIndex + 1);
}

export function trimCharacters(someString: string, charactersToTrim: string[]) {
  return rTrimCharacters(lTrimCharacters(someString, charactersToTrim), charactersToTrim);
}
export function toFixedPrecision(someNumber: number, decimals: number) {
  let factor = Math.pow(10, decimals);
  return Math.floor(someNumber * factor) / factor;
}

export function isWhiteSpace(str: string): boolean {
  return trimWhiteSpace(str) === '';
}
export function isNumeric(someString: string): boolean {
  return (/^[0-9]/.test(someString));
}




