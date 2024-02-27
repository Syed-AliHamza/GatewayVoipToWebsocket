import { describe, expect, it } from '@jest/globals';

describe('1+1', () => {
  it('should be 2', async (done) => {
    expect(2).toEqual(2);
    done();
  });
});
