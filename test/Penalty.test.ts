import {describe, expect, it} from "vitest";
import {Penalty, PenaltyClass} from "@/Penalty";
import {TextBox} from "@/TextBox";

describe('Penalty', () => {
  describe('getExportObject', () => {
    it('returns an object with Penalty class and properties', () => {
      const penalty = new Penalty();
      penalty.setPenalty(50).setFlag(true);
      const exported = penalty.getExportObject();
      
      expect(exported.class).toBe(PenaltyClass);
      expect(exported.penalty).toBe(50);
      expect(exported.flagged).toBe(true);
    });

    it('includes itemToInsert if present', () => {
      const penalty = new Penalty();
      const textBox = new TextBox();
      textBox.setText('-');
      penalty.setItemToInsert(textBox);
      const exported = penalty.getExportObject();
      
      expect(exported.itemToInsert).toBeDefined();
      expect(exported.itemToInsert.text).toBe('-');
    });
  });

  describe('setFromObject', () => {
    it('sets properties from object', () => {
      const penalty = new Penalty();
      penalty.setFromObject({
        penalty: 100,
        flagged: true
      }, false);
      
      expect(penalty.getPenalty()).toBe(100);
      expect(penalty.isFlagged()).toBe(true);
    });

    it('sets itemToInsert from object', () => {
      const penalty = new Penalty();
      penalty.setFromObject({
        itemToInsert: {
          class: 'TextBox',
          text: '-'
        }
      }, false);
      
      expect(penalty.hasItemToInsert()).toBe(true);
      expect(penalty.getItemToInsert()?.getText()).toBe('-');
    });

    it('handles null itemToInsert', () => {
      const penalty = new Penalty();
      const textBox = new TextBox();
      penalty.setItemToInsert(textBox);
      
      penalty.setFromObject({
        itemToInsert: null
      }, false);
      
      expect(penalty.hasItemToInsert()).toBe(false);
    });
  });
});
