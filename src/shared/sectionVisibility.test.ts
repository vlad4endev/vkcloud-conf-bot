import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSectionVisible } from './sectionVisibility';

describe('sectionVisibility', () => {
  it('treats only explicit false as hidden', () => {
    assert.equal(isSectionVisible(undefined), true);
    assert.equal(isSectionVisible(null), true);
    assert.equal(isSectionVisible(''), true);
    assert.equal(isSectionVisible('true'), true);
    assert.equal(isSectionVisible('false'), false);
  });
});
