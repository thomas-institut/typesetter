import {describe, expect, it} from "vitest";
import {ItemList, ItemListClass} from "@/ItemList";
import {TextBox} from "@/TextBox";
import {Glue} from "@/Glue";

describe('ItemList', () => {
  describe('getExportObject', () => {
    it('returns an object with ItemList class and a list of exported items', () => {
      const itemList = new ItemList();
      const textBox = new TextBox();
      textBox.setText('Hello');
      const glue = new Glue();
      glue.setWidth(10);
      
      itemList.pushItem(textBox);
      itemList.pushItem(glue);
      
      const exported = itemList.getExportObject();
      
      expect(exported.class).toBe(ItemListClass);
      expect(exported.list).toHaveLength(2);
      expect(exported.list[0].class).toBe('TextBox');
      expect(exported.list[0].text).toBe('Hello');
      expect(exported.list[1].class).toBe('Glue');
      expect(exported.list[1].width).toBe(10);
    });
  });

  describe('setFromObject', () => {
    it('sets items from object', () => {
      const itemList = new ItemList();
      itemList.setFromObject({
        list: [
          {class: 'TextBox', text: 'World'},
          {class: 'Glue', width: 20}
        ]
      }, false);
      
      expect(itemList.getItemCount()).toBe(2);
      expect(itemList.getList()[0]).toBeInstanceOf(TextBox);
      expect((itemList.getList()[0] as TextBox).getText()).toBe('World');
      expect(itemList.getList()[1]).toBeInstanceOf(Glue);
      expect(itemList.getList()[1].getWidth()).toBe(20);
    });
  });
});
