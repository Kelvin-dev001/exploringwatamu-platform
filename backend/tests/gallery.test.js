'use strict';

const { urlList, nextGallery } = require('../src/services/gallery');

describe('gallery merge on listing updates', () => {
  const stored = ['https://img/a.jpg', 'https://img/b.jpg'];

  it('keeps the stored photos when the kept list is not sent', () => {
    expect(nextGallery(stored, undefined, [])).toBeUndefined();
  });

  it('appends new uploads to the stored photos when the kept list is not sent', () => {
    expect(nextGallery(stored, undefined, ['https://img/new.jpg'])).toEqual([...stored, 'https://img/new.jpg']);
  });

  it('uses the kept list, in its order, then new uploads', () => {
    expect(nextGallery(stored, JSON.stringify(['https://img/b.jpg']), ['https://img/new.jpg'])).toEqual(['https://img/b.jpg', 'https://img/new.jpg']);
  });

  it('an explicit empty list removes every stored photo', () => {
    expect(nextGallery(stored, '[]', [])).toEqual([]);
  });

  it('reads JSON strings, arrays and single URLs; drops junk', () => {
    expect(urlList('["x", "", 3, " y "]')).toEqual(['x', 'y']);
    expect(urlList(['x', null])).toEqual(['x']);
    expect(urlList('https://img/one.jpg')).toEqual(['https://img/one.jpg']);
    expect(urlList('[not json')).toEqual([]);
    expect(urlList({})).toEqual([]);
  });
});
