import {describe, expect, it} from "vitest";
import {TypesetterObject, TypesetterObjectClass} from "@/TypesetterObject";

describe('TypesetterObject', () => {
  describe('getExportObject', () => {
    it('returns an object with class name', () => {
      const obj = new TypesetterObject();
      const exported = obj.getExportObject();
      expect(exported.class).toBe(TypesetterObjectClass);
    });

    it('includes metadata if not empty', () => {
      const obj = new TypesetterObject();
      obj.addMetadata('key', 'value');
      const exported = obj.getExportObject();
      expect(exported.metadata).toEqual({key: 'value'});
    });

    it('does not include metadata if empty', () => {
      const obj = new TypesetterObject();
      const exported = obj.getExportObject();
      expect(exported.metadata).toBeUndefined();
    });
  });

  describe('setFromObject', () => {
    it('sets metadata from object', () => {
      const obj = new TypesetterObject();
      obj.setFromObject({
        metadata: {key1: 'value1', key2: 42}
      }, false);
      expect(obj.getMetadata('key1')).toBe('value1');
      expect(obj.getMetadata('key2')).toBe(42);
    });

    it('merges metadata if mergeValues is true', () => {
      const obj = new TypesetterObject();
      obj.addMetadata('key1', 'original');
      obj.setFromObject({
        metadata: {key2: 'new'}
      }, true);
      expect(obj.getMetadata('key1')).toBe('original');
      expect(obj.getMetadata('key2')).toBe('new');
    });

    it('clears metadata if mergeValues is false', () => {
      const obj = new TypesetterObject();
      obj.addMetadata('key1', 'original');
      obj.setFromObject({
        metadata: {key2: 'new'}
      }, false);
      expect(obj.hasMetadata('key1')).toBe(false);
      expect(obj.getMetadata('key2')).toBe('new');
    });

    it('handles null or missing metadata in input object', () => {
      const obj = new TypesetterObject();
      obj.addMetadata('key', 'value');
      
      // Missing metadata
      obj.setFromObject({}, true);
      expect(obj.getMetadata('key')).toBe('value');
      
      // Null metadata
      obj.setFromObject({metadata: null}, true);
      expect(obj.getMetadata('key')).toBe('value');
      
      // Non-object metadata
      obj.setFromObject({metadata: 'not-an-object'}, true);
      expect(obj.getMetadata('key')).toBe('value');
    });
  });

  describe('metadata methods', () => {
    it('addMetadata and getMetadata', () => {
      const obj = new TypesetterObject();
      obj.addMetadata('test', 123);
      expect(obj.getMetadata('test')).toBe(123);
    });

    it('hasMetadata', () => {
      const obj = new TypesetterObject();
      expect(obj.hasMetadata('test')).toBe(false);
      obj.addMetadata('test', 123);
      expect(obj.hasMetadata('test')).toBe(true);
    });

    it('deleteMetadata', () => {
      const obj = new TypesetterObject();
      obj.addMetadata('test', 123);
      obj.deleteMetadata('test');
      expect(obj.hasMetadata('test')).toBe(false);
    });
  });
});
