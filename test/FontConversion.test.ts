import { Glue } from '@/Glue'
import { Penalty } from '@/Penalty'
import { ItemList } from '@/ItemList'
import {FontConversions} from '@/FontConversions'
import { TextBox } from '@/TextBox'
import { TextBoxFactory } from '@/TextBoxFactory'
import { describe, test, expect } from 'vitest'
import {FontConversionDefinition} from "@/Style/StyleSheet";

const emptyFontConversionsDef: FontConversionDefinition[] = []
const multipleFontConvDef: FontConversionDefinition[] =[
  {
    from: { fontFamily: 'FreeStuff'}, to: {fontFamily: 'OtherStuff'}
  },
  {
    from: { fontStyle: 'italic'}, to: {fontFamily: 'MyItalic', fontStyle: ''}
  }
]

describe('FontConversion', () =>{
  test('Non TextBox', () => {
    const items = [ new Glue(), new Penalty(), new ItemList()]
    items.forEach( (item) => {
      expect(FontConversions.applyFontConversions(item, multipleFontConvDef), `Item ${item.constructor.name}`).toBe(item)
    })
  })

  test('Empty Match', () => {
    const item = TextBoxFactory.simpleText('test')
    const fontFamily = item.getFontFamily()
    const fontWeight = item.getFontWeight()
    const fontStyle = item.getFontStyle()
    const convertedItem = FontConversions.applyFontConversions(item, emptyFontConversionsDef)
    expect(convertedItem).toBeInstanceOf(TextBox)
    expect(convertedItem.getText()).toBe(item.getText())
    expect(convertedItem.getFontFamily()).toBe(fontFamily)
    expect(convertedItem.getFontWeight()).toBe(fontWeight)
    expect(convertedItem.getFontStyle()).toBe(fontStyle)
  })

  test('Bold Match', ()=>{
    const testFont = 'TestFont'
    const fakeBoldFont = 'BoldFont'

    // A matching item
    const item = TextBoxFactory.simpleText('test', { fontFamily: testFont, fontWeight: 'bold'})
    const fontConvDef = { from: {fontWeight: 'bold'}, to: { fontFamily: fakeBoldFont, fontWeight: ''}}
    const fontStyle = item.getFontStyle()
    const defArray = arrayCopy(multipleFontConvDef)
    defArray.push(fontConvDef)
    const convertedItem = FontConversions.applyFontConversions(item, defArray)
    expect(convertedItem).toBeInstanceOf(TextBox)
    expect(convertedItem.getText()).toBe(item.getText())
    expect(convertedItem.getFontFamily()).toBe(fakeBoldFont)
    expect(convertedItem.getFontWeight()).toBe('')
    expect(convertedItem.getFontStyle()).toBe(fontStyle)

    // an item that does not match!
    const item2 = TextBoxFactory.simpleText('test', { fontFamily: testFont, fontWeight: ''})
    const convertedItem2 = FontConversions.applyFontConversions(item2, [ fontConvDef])
    expect(convertedItem2.getText()).toBe(item.getText())
    expect(convertedItem2.getFontFamily()).toBe(testFont)
    expect(convertedItem2.getFontWeight()).toBe('')
    expect(convertedItem2.getFontStyle()).toBe(fontStyle)
  })

  test( 'Arabic Text', () => {
    const arabicFont = 'Amiri'
    const fontConvDef = { from: {script: 'ar'}, to: { fontFamily: arabicFont}}
    const defArray = arrayCopy(multipleFontConvDef)
    defArray.push(fontConvDef)

    const arabicItem = TextBoxFactory.simpleText('يشسي.', {fontWeight: 'bold'})
    let text = arabicItem.getText()
    let convertedItem = FontConversions.applyFontConversions(arabicItem, defArray)
    expect(convertedItem.getText()).toBe(text)
    expect(convertedItem.getFontFamily()).toBe(arabicFont)
    expect(convertedItem.getFontWeight()).toBe('bold')

    let nonArabicItem = TextBoxFactory.simpleText('latinus')
    text = nonArabicItem.getText()
    let font = nonArabicItem.getFontFamily()
    let weight = nonArabicItem.getFontWeight()
    convertedItem = FontConversions.applyFontConversions(nonArabicItem, defArray)
    expect(convertedItem.getText()).toBe(text)
    expect(convertedItem.getFontFamily()).toBe(font)
    expect(convertedItem.getFontWeight()).toBe(weight)


    nonArabicItem = TextBoxFactory.simpleText('latيشسيبinus')
    text = nonArabicItem.getText()
    font = nonArabicItem.getFontFamily()
    weight = nonArabicItem.getFontWeight()
    convertedItem = FontConversions.applyFontConversions(nonArabicItem, defArray)
    expect(convertedItem.getText()).toBe(text)
    expect(convertedItem.getFontFamily()).toBe(font)
    expect(convertedItem.getFontWeight()).toBe(weight)

  })

  test( 'Hebrew Text', () => {
    const hebrewFont = 'SBL Hebrew'
    const fontConvDef = { from: {script: 'he'}, to: { fontFamily: hebrewFont, fontSizeFactor: 1.2}}
    const defArray = [fontConvDef]

    const hebrewItem = TextBoxFactory.simpleText('שלום')
    const originalSize = hebrewItem.getFontSize()
    const convertedItem = FontConversions.applyFontConversions(hebrewItem, defArray)
    expect(convertedItem.getFontFamily()).toBe(hebrewFont)
    expect(convertedItem.getFontSize()).toBe(originalSize * 1.2)
  })

  test( 'Greek Text', () => {
    const greekFont = 'Gentium'
    const fontConvDef = { from: {script: 'el'}, to: { fontFamily: greekFont}}
    const defArray = [fontConvDef]

    const greekItem = TextBoxFactory.simpleText('λόγος')
    const convertedItem = FontConversions.applyFontConversions(greekItem, defArray)
    expect(convertedItem.getFontFamily()).toBe(greekFont)
  })

  test( 'Latin Text', () => {
    const latinFont = 'Garamond'
    const fontConvDef = { from: {script: 'la'}, to: { fontFamily: latinFont}}
    const defArray = [fontConvDef]

    const latinItem = TextBoxFactory.simpleText('latin')
    let convertedItem = FontConversions.applyFontConversions(latinItem, defArray)
    expect(convertedItem.getFontFamily()).toBe(latinFont)

    // Negative tests: Hebrew text should NOT be converted
    const hebrewItem = TextBoxFactory.simpleText('שלום')
    let originalFont = hebrewItem.getFontFamily()
    convertedItem = FontConversions.applyFontConversions(hebrewItem, defArray)
    expect(convertedItem.getFontFamily()).toBe(originalFont)

    const hebrewPunctItem = TextBoxFactory.simpleText('ב”הסתעפות“')
    originalFont = hebrewPunctItem.getFontFamily()
    convertedItem = FontConversions.applyFontConversions(hebrewPunctItem, defArray)
    expect(convertedItem.getFontFamily()).toBe(originalFont)
  })

  test( 'Multiple Script Rules', () => {
    const defs = [
      { from: { script: 'ar' }, to: { fontFamily: 'Amiri' } },
      { from: { script: 'he' }, to: { fontFamily: 'SBL Hebrew' } },
      { from: { script: 'la' }, to: { fontFamily: 'Garamond' } }
    ]

    const arabicItem = TextBoxFactory.simpleText('يشسي')
    expect(FontConversions.applyFontConversions(arabicItem, defs).getFontFamily()).toBe('Amiri')

    const hebrewItem = TextBoxFactory.simpleText('שלום')
    expect(FontConversions.applyFontConversions(hebrewItem, defs).getFontFamily()).toBe('SBL Hebrew')

    const latinItem = TextBoxFactory.simpleText('latin')
    expect(FontConversions.applyFontConversions(latinItem, defs).getFontFamily()).toBe('Garamond')
  })
})


function arrayCopy<T>(array: T[]) {
  const newArray: T[] = []
  array.forEach( (e) => { newArray.push(e)})
  return newArray
}