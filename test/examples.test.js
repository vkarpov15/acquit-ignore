'use strict';

const acquit = require('acquit');
const assert = require('assert');

describe('acquit-ignore', function() {
  afterEach(function() {
    acquit.removeAllTransforms();
  });

  /**
   * By default, `acquit-ignore` will attach a transform to acquit
   * that removes any code in a block that's between
   * '// acquit:ignore:start' and '// acquit:ignore:end'.
   */
  it('removes code between delimiters', function() {
    const acquit = require('acquit');
    require('acquit-ignore')();

    const contents = [
      'describe(\'test\', function() {',
      '  it(\'works\', function(done) {',
      '    // acquit:ignore:start',
      '    setup();',
      '    // acquit:ignore:end',
      '    var x = 1;',
      '    // acquit:ignore:start',
      '    assert.equal(x, 1);',
      '    // acquit:ignore:end',
      '',
      '    setTimeout(function() {',
      '      assert.equal(x, 2);',
      '      // acquit:ignore:start',
      '      done();',
      '      // acquit:ignore:end',
      '    }, 0);',
      '    ++x;',
      '  });',
      '});'
    ].join('\n');

    const blocks = acquit.parse(contents);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].blocks[0].contents, 'works');

    const expectedCode = [
      'var x = 1;',
      '',
      'setTimeout(function() {',
      '  assert.equal(x, 2);',
      '}, 0);',
      '++x;'
    ].join('\n');

    assert.equal(blocks[0].blocks[0].code, expectedCode);
  });

  /**
   * Don't like 'acquit:ignore:start' and 'acquit:ignore:end'?
   * Set your own by setting the 'start' and 'end' options.
   */
  it('supports custom delimiters', function() {
    const acquit = require('acquit');
    require('acquit-ignore')({
      start: '// bacon',
      end: '// eggs'
    });

    const contents = [
      'describe(\'test\', function() {',
      '  it(\'works\', function(done) {',
      '    var x = 1;',
      '    // acquit:ignore:start',
      '    assert.equal(x, 1);',
      '    // acquit:ignore:end',
      '',
      '    setTimeout(function() {',
      '      assert.equal(x, 2);',
      '      // bacon',
      '      done();',
      '      // eggs',
      '    }, 0);',
      '    ++x;',
      '  });',
      '});'
    ].join('\n');

    const blocks = acquit.parse(contents);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].blocks[0].contents, 'works');

    const expectedCode = [
      'var x = 1;',
      '// acquit:ignore:start',
      'assert.equal(x, 1);',
      '// acquit:ignore:end',
      '',
      'setTimeout(function() {',
      '  assert.equal(x, 2);',
      '}, 0);',
      '++x;'
    ].join('\n');

    assert.equal(blocks[0].blocks[0].code, expectedCode);
  });

  /**
   * By default, acquit-ignore attaches itself to the acquit
   * singleton. However, you can also attach it to an acquit
   * instance.
   */
  it('can accept an acquit instance', function() {
    const instance = require('acquit')();
    require('acquit-ignore')(instance, {
      start: '// bacon',
      end: '// eggs'
    });

    const contents = [
      'describe(\'test\', function() {',
      '  it(\'works\', function(done) {',
      '    var x = 1;',
      '    // bacon',
      '    assert.equal(x, 1);',
      '    // eggs',
      '',
      '    setTimeout(function() {',
      '      assert.equal(x, 2);',
      '      // bacon',
      '      done();',
      '      // eggs',
      '    }, 0);',
      '    ++x;',
      '  });',
      '});'
    ].join('\n');

    const blocks = instance.parse(contents);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].blocks[0].contents, 'works');

    const expectedCode = [
      'var x = 1;',
      '',
      'setTimeout(function() {',
      '  assert.equal(x, 2);',
      '}, 0);',
      '++x;'
    ].join('\n');

    assert.equal(blocks[0].blocks[0].code, expectedCode);
  });

  describe('remove extra indent', () => {
    it('removes indent that changes from a start to the end comment', function() {
      const acquit = require('acquit');
      require('acquit-ignore')();
  
      var contents = [
        'describe(\'test\', function() {',
        '  it(\'works\', function(done) {',
        '    // acquit:ignore:start',
        '    const t = 1',
        '    // acquit:ignore:end',
        '    const a = 2',
        '    // acquit:ignore:start',
        '    setTimeout(function() {',
        '      // acquit:ignore:end',
        '      something.save()',
        '      // acquit:ignore:start',
        '      t.cb(() => {',
        '        // acquit:ignore:end',
        '        other.save()',
        '        // acquit:ignore:start',
        '      })',
        '      // acquit:ignore:end',
        '      s.cb(() => {',
        '        another.save()',
        '      })',
        '      // acquit:ignore:start',
        '    }, 0);',
        '    // acquit:ignore:end',
        '  });',
        '});'
      ].join('\n');
  
      const blocks = acquit.parse(contents);
      assert.equal(blocks.length, 1);
      assert.equal(blocks[0].blocks[0].contents, 'works');
  
      const expectedCode = [
        'const a = 2',
        'something.save()',
        'other.save()',
        's.cb(() => {',
        '  another.save()',
        '})'
      ].join('\n');
  
      assert.equal(blocks[0].blocks[0].code, expectedCode);
    });

    // this situation (comments aligned with previous line) can happen because eslint somehow allows that
    it('removes indent that changes from a start to the end comment even if end comment is aligned to the previous indent', function() {
      const acquit = require('acquit');
      require('acquit-ignore')();
  
      var contents = [
        'describe(\'test\', function() {',
        '  it(\'works\', function(done) {',
        '    // acquit:ignore:start',
        '    const t = 1',
        '    // acquit:ignore:end',
        '    const a = 2',
        '    // acquit:ignore:start',
        '    setTimeout(function() {',
        '    // acquit:ignore:end', // should get the indent from the next line
        '      something.save()', // should get indent from here
        '      // acquit:ignore:start',
        '      t.cb(() => {',
        '      // acquit:ignore:end', // should get the indent from the next line
        '        other.save()', // should get indent from here
        '        // acquit:ignore:start',
        '      })',
        '      // acquit:ignore:end',
        '      s.cb(() => {',
        '        another.save()',
        '      })',
        '      // acquit:ignore:start',
        '    }, 0);',
        '    // acquit:ignore:end',
        '  });',
        '});'
      ].join('\n');
  
      const blocks = acquit.parse(contents);
      assert.equal(blocks.length, 1);
      assert.equal(blocks[0].blocks[0].contents, 'works');
  
      const expectedCode = [
        'const a = 2',
        'something.save()',
        'other.save()',
        's.cb(() => {',
        '  another.save()',
        '})'
      ].join('\n');
  
      assert.equal(blocks[0].blocks[0].code, expectedCode);
    });

    it('does not remove indent that changes from a start to the end comment if end comment is aligned to the previous indent', function() {
      const acquit = require('acquit');
      require('acquit-ignore')({
        getIndentDifferenceFromNextLine: false
      });
  
      var contents = [
        'describe(\'test\', function() {',
        '  it(\'works\', function(done) {',
        '    // acquit:ignore:start',
        '    const t = 1',
        '    // acquit:ignore:end',
        '    const a = 2',
        '    // acquit:ignore:start',
        '    setTimeout(function() {',
        '    // acquit:ignore:end', // indent should not be gotten from the next line anymore, because option disabled it
        '      something.save()',
        '      // acquit:ignore:start',
        '      t.cb(() => {',
        '      // acquit:ignore:end', // indent should not be gotten from the next line anymore, because option disabled it
        '        other.save()',
        '        // acquit:ignore:start',
        '      })',
        '      // acquit:ignore:end',
        '      s.cb(() => {',
        '        another.save()',
        '      })',
        '      // acquit:ignore:start',
        '    }, 0);',
        '    // acquit:ignore:end',
        '  });',
        '});'
      ].join('\n');
  
      const blocks = acquit.parse(contents);
      assert.equal(blocks.length, 1);
      assert.equal(blocks[0].blocks[0].contents, 'works');
  
      const expectedCode = [
        'const a = 2',
        '  something.save()',
        '  other.save()',
        's.cb(() => {',
        '  another.save()',
        '})'
      ].join('\n');
  
      assert.equal(blocks[0].blocks[0].code, expectedCode);
    });

    it('handle different start indexes', function() {
      const acquit = require('acquit');
      require('acquit-ignore')();
  
      var contents = [
        'describe(\'test\', function() {',
        '  it(\'works\', function(done) {',
        '    // acquit:ignore:start',
        '    {',
        '      // acquit:ignore:end',
        '      test1',
        '      // acquit:ignore:start',
        '    }',
        '    // acquit:ignore:end',
        '    test2',
        '    // acquit:ignore:start',
        '    {',
        '      // acquit:ignore:end',
        '      test3',
        '      // acquit:ignore:start',
        '    }',
        '    // acquit:ignore:end',
        '  });',
        '});'
      ].join('\n');
  
      const blocks = acquit.parse(contents);
      assert.equal(blocks.length, 1);
      assert.equal(blocks[0].blocks[0].contents, 'works');
  
      const expectedCode = [
        'test1',
        'test2',
        'test3'
      ].join('\n');
  
      assert.equal(blocks[0].blocks[0].code, expectedCode);
    });
  });

  it('works with "nextLine"', function() {
    const acquit = require('acquit');
    require('acquit-ignore')();

    var contents = [
      'describe(\'test\', function() {',
      '  it(\'works\', function(done) {',
      '    // acquit:ignore-next-line',
      '    const t = 1',
      '    const a = 2',
      '    // acquit:ignore-next-line',
      '    setTimeout(function() {',
      '      something.save()',
      '      // acquit:ignore-next-line',
      '      t.cb(() => {',
      '        other.save()',
      '        // acquit:ignore-next-line',
      '      })',
      '      s.cb(() => {',
      '        another.save()',
      '      })',
      '      // acquit:ignore-next-line',
      '    }, 0);',
      '  });',
      '});'
    ].join('\n');

    const blocks = acquit.parse(contents);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].blocks[0].contents, 'works');

    const expectedCode = [
      'const a = 2',
      'something.save()',
      'other.save()',
      's.cb(() => {',
      '  another.save()',
      '})'
    ].join('\n');

    assert.equal(blocks[0].blocks[0].code, expectedCode);
  });
});
