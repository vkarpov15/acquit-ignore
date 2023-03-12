# acquit-ignore

Acquit plugin for removing lines of code from output

[![Build Status](https://travis-ci.org/vkarpov15/acquit-ignore.svg?branch=master)](https://travis-ci.org/vkarpov15/acquit-ignore)
[![Coverage Status](https://coveralls.io/repos/vkarpov15/acquit-ignore/badge.svg?branch=master&service=github)](https://coveralls.io/github/vkarpov15/acquit-ignore?branch=master)

## acquit-ignore

#### It removes code between delimiters

By default, `acquit-ignore` will attach a transform to acquit
that removes any code in a block that's between
'// acquit:ignore:start' and '// acquit:ignore:end'.

```javascript
    const acquit = require('acquit');
require('acquit-ignore')();

var contents = [
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
  '++x;',
].join('\n');

assert.equal(blocks[0].blocks[0].code, expectedCode);
```

#### It supports custom delimiters

Don't like 'acquit:ignore:start' and 'acquit:ignore:end'?
Set your own by setting the 'start' and 'end' options.

```javascript
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
```

#### It can accept an acquit instance

By default, acquit-ignore attaches itself to the acquit
singleton. However, you can also attach it to an acquit
instance.

```javascript
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
```

#### Can remove indent that changes between ignore comments

Can remove indent that changed between the start and end comments, to allow smoother flow:

```javascript
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
```

Also if option `getIndentDifferenceFromNextLine` is `true` (which is the default), then the indent will also be gotten from the next line after the end comment:

```javascript
const acquit = require('acquit');
require('acquit-ignore')({
  getIndentDifferenceFromNextLine: true
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
```

#### Also supports a "ignore-next-line"

Like eslint's `eslint-disable-next-line`, this package also supports a similar method:

```javascript
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
```
