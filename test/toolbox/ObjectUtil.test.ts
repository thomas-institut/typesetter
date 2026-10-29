import {describe, expect, it} from 'vitest';
import {deepGetValuesForKey} from '@/toolbox/ObjectUtil';

describe('ObjectUtil', () => {
  it('collects values from a large nested object', () => {
    const matchCount = 150_000;
    const children = Object.fromEntries(
      Array.from({length: matchCount}, (_, index) => [`child${index}`, {target: index}])
    );

    const values = deepGetValuesForKey({children}, 'target');

    expect(values).toHaveLength(matchCount);
    expect(values[0]).toBe(0);
    expect(values[matchCount - 1]).toBe(matchCount - 1);
  });
});