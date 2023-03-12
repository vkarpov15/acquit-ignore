'use strict';

const Archetype = require('archetype');

const OptionsType = new Archetype({
  start: {
    $type: 'string',
    $default: '// acquit:ignore:start'
  },
  end: {
    $type: 'string',
    $default: '// acquit:ignore:end'
  }
}).compile('OptionsType');

module.exports = function(parser, options) {
  if (!parser) {
    parser = require('acquit');
  } else if (parser.constructor.name === 'Object') {
    options = parser;
    parser = require('acquit');
  }

  options = new OptionsType(options || {});

  const inlineRegexp = new RegExp('^[\\s]*' + options.start + '[\\s\\S]*?' +
    options.end + '\n?', 'gm');

  parser.transform(function(block) {
    block.code = block.code.
      replace(inlineRegexp, '');
  });
};
